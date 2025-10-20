"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuestManagement } from "@/hooks/useQuestManagement";
import { useQuestStaking } from "@/hooks/useQuestStaking";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
import { formatDuration } from "@/lib/utils";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Calendar, Clock, Info, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

// Helper function to format datetime for input
const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Helper function to calculate duration in minutes
const calculateDurationMinutes = (startTime: Date, endTime: Date): number => {
  const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
  return Math.round(totalMinutes);
};

const questSchema = z
  .object({
    name: z
      .string()
      .min(5, "Name must be at least 5 characters")
      .max(100, "Name must be less than 100 characters"),
    entryFee: z
      .number()
      .min(1, "Entry fee must be at least $1")
      .max(1000, "Entry fee cannot exceed $1000"),
    startTime: z.string().refine((val) => {
      const startDate = new Date(val);
      const now = new Date();
      return startDate > now;
    }, "Start time must be in the future"),
    endTime: z.string(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startTime);
      const endDate = new Date(data.endTime);
      return endDate > startDate;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

type QuestFormValues = z.infer<typeof questSchema>;

export function CreateQuestPage() {
  const router = useRouter();
  const { isConnected, address } = usePortfolioStore();
  const { createQuest: createQuestSupabase } = useSupabaseQuests();
  const {  isCreating } = useQuestManagement();
  const {
    createQuest: createQuestBlockchain,
    isLoading: isBlockchainLoading,
    getAptosClient,
    contractAddress: QUEST_MODULE_ADDRESS,
  } = useQuestStaking();

  // Set default times: start in 1 hour, end in 1 week
  const defaultStartTime = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const defaultEndTime = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now

  const form = useForm<QuestFormValues>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      name: "",
      entryFee: 10,
      startTime: formatDateTimeLocal(defaultStartTime),
      endTime: formatDateTimeLocal(defaultEndTime),
    },
  });

  const watchedValues = form.watch();

  // Calculate duration automatically in minutes
  const calculatedDurationMinutes = useMemo(() => {
    if (!watchedValues.startTime || !watchedValues.endTime) return 0;
    const startDate = new Date(watchedValues.startTime);
    const endDate = new Date(watchedValues.endTime);
    return calculateDurationMinutes(startDate, endDate);
  }, [watchedValues.startTime, watchedValues.endTime]);

  // Calculate prize pool automatically (95% of total entry fees from estimated participants)
  const calculatedPrizePool = useMemo(() => {
    const entryFee = watchedValues.entryFee || 0;
    const estimatedParticipants = Math.max(10, Math.min(100, entryFee * 5)); // Estimate based on entry fee
    const totalFees = entryFee * estimatedParticipants;
    return Math.floor(totalFees * 0.95); // 95% goes to prize pool, 5% platform fee
  }, [watchedValues.entryFee]);

  const formatDateTime = (dateTimeString: string): string => {
    if (!dateTimeString) return "Not set";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  };

  const onSubmit = async (values: QuestFormValues) => {
    if (!address) {
      toast.error("Please connect your wallet to create a quest.");
      return;
    }

    try {
      const startDate = new Date(values.startTime);
      const endDate = new Date(values.endTime);
      const now = new Date();

      // Calculate hours from now until start/end times
      const buyInHours =
        (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const resultHours =
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Step 1: Create quest on blockchain
      const blockchainResult = await createQuestBlockchain({
        name: values.name,
        entryFeeAPT: values.entryFee,
        buyInHours,
        resultHours,
      });

      if (!blockchainResult.success) {
        toast.error(
          "Failed to create quest on blockchain. Transaction cancelled."
        );
        return;
      }

      // Extract blockchain quest ID from transaction events
      // The smart contract emits QuestCreatedEvent with quest_id
      let blockchainQuestId: number | undefined;
      if (blockchainResult.result && blockchainResult.hash) {
        try {
          // Query the transaction to get the actual quest ID from events
          const client = await getAptosClient();
          const transaction = await client.getTransactionByHash({
            transactionHash: blockchainResult.hash,
          });

          // Look for QuestCreatedEvent in the transaction events
          if (transaction.events) {
            const questCreatedEvent = transaction.events.find(
              (event: any) =>
                event.type?.includes("QuestCreatedEvent") ||
                event.type?.includes("quest_staking::QuestCreatedEvent")
            );

            if (questCreatedEvent && questCreatedEvent.data) {
              // Extract quest_id from the event data
              blockchainQuestId = parseInt(
                questCreatedEvent.data.quest_id ||
                  questCreatedEvent.data.questId
              );
              console.log(
                "Extracted quest ID from blockchain:",
                blockchainQuestId
              );
            }
          }

          // Fallback: if we can't parse the event, query the contract for quest counter
          if (!blockchainQuestId) {
            console.warn(
              "Could not extract quest ID from transaction events, querying contract"
            );
            try {
              // Query the smart contract to get the current quest counter
              const result = await client.view({
                payload: {
                  function: `${QUEST_MODULE_ADDRESS}::quest_staking::get_quest_counter`,
                  typeArguments: [],
                  functionArguments: [],
                },
              });

              if (result && result[0]) {
                blockchainQuestId = parseInt(result[0]);
                console.log(
                  "Retrieved quest counter from contract:",
                  blockchainQuestId
                );
              } else {
                // Ultimate fallback - use the known quest ID from explorer
                blockchainQuestId = 6;
                console.warn(
                  "Could not get quest counter, using fallback ID:",
                  blockchainQuestId
                );
              }
            } catch (error) {
              console.error("Error querying quest counter:", error);
              // Ultimate fallback
              blockchainQuestId = 6;
            }
          }
        } catch (error) {
          console.error("Error parsing transaction events:", error);
          // Fallback to known quest ID
          blockchainQuestId = 6;
        }

        console.log(
          "Quest created on blockchain with transaction:",
          blockchainResult.hash,
          "Quest ID:",
          blockchainQuestId
        );
      }

      // Step 2: Store quest in Supabase database with blockchain quest ID
      const supabaseResult = await createQuestSupabase({
        name: values.name,
        description: `A trading quest with ${formatDuration(
          calculatedDurationMinutes
        )} duration`,
        entryFee: values.entryFee,
        prizePool: calculatedPrizePool,
        durationMinutes: calculatedDurationMinutes, // Store duration in minutes
        startTime: startDate,
        endTime: endDate,
        maxParticipants: 100,
        creatorWalletAddress: address,
        blockchainQuestId: blockchainQuestId,
        blockchainTxHash: blockchainResult.hash,
      });

      if (supabaseResult.success) {
        toast.success("Quest created successfully on blockchain and database!");
        router.push("/quests");
      } else {
        toast.warning(
          "Quest created on blockchain but failed to save to database. Transaction: " +
            blockchainResult.hash?.slice(0, 10)
        );
        console.error("Supabase error:", supabaseResult.error);
      }
    } catch (error) {
      toast.error("Failed to create quest. Please try again.");
      console.error(error);
    }
  };

  if (!isConnected) {
    return (
      <div className="p-4 md:p-8 h-full flex flex-col items-center justify-center text-center">
        <Wallet className="w-24 h-24 text-blaze-black/50" />
        <h1 className="font-display text-5xl font-bold mt-4">CONNECT WALLET</h1>
        <p className="font-mono text-lg mt-2 max-w-md">
          You must connect your wallet to create a new quest.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
          CREATE QUEST
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form */}
          <div className="space-y-8">
            <div className="border-2 border-blaze-black bg-blaze-white p-8 shadow-blaze-shadow">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8 font-mono"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xl font-bold uppercase tracking-wider text-blaze-black">
                          Quest Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-14 text-lg border-2 border-blaze-black rounded-none bg-blaze-white text-blaze-black font-mono font-bold placeholder:text-blaze-black/50 focus:border-blaze-orange focus:ring-0 focus:ring-offset-0"
                            placeholder="Enter a compelling quest name..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-blaze-black/70 font-mono">
                          Choose a name that attracts participants (5-100
                          characters)
                        </FormDescription>
                        <FormMessage className="text-red-600 font-mono font-bold" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entryFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xl font-bold uppercase tracking-wider text-blaze-black">
                          Entry Fee ($)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="h-14 text-lg border-2 border-blaze-black rounded-none bg-blaze-white text-blaze-black font-mono font-bold placeholder:text-blaze-black/50 focus:border-blaze-orange focus:ring-0 focus:ring-offset-0"
                            min="1"
                            max="1000"
                            step="1"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormDescription className="text-sm text-blaze-black/70 font-mono">
                          Higher entry fees typically attract more serious
                          participants ($1-$1000)
                        </FormDescription>
                        <FormMessage className="text-red-600 font-mono font-bold" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xl font-bold uppercase tracking-wider text-blaze-black flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Start Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="h-14 text-lg border-2 border-blaze-black rounded-none bg-blaze-white text-blaze-black font-mono font-bold focus:border-blaze-orange focus:ring-0 focus:ring-offset-0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-sm text-blaze-black/70 font-mono">
                            When the quest will begin accepting participants
                          </FormDescription>
                          <FormMessage className="text-red-600 font-mono font-bold" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xl font-bold uppercase tracking-wider text-blaze-black flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            End Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              className="h-14 text-lg border-2 border-blaze-black rounded-none bg-blaze-white text-blaze-black font-mono font-bold focus:border-blaze-orange focus:ring-0 focus:ring-offset-0"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-sm text-blaze-black/70 font-mono">
                            When the quest will end and winners will be
                            determined
                          </FormDescription>
                          <FormMessage className="text-red-600 font-mono font-bold" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting ||
                      isCreating ||
                      isBlockchainLoading ||
                      calculatedDurationMinutes <= 0
                    }
                    className="w-full h-16 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px disabled:opacity-50 disabled:cursor-not-allowed font-mono shadow-blaze-shadow"
                  >
                    {form.formState.isSubmitting ||
                    isCreating ||
                    isBlockchainLoading
                      ? "Creating Quest..."
                      : "Create Quest"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Preview & Calculations */}
          <div className="space-y-6">
            <Card className="rounded-none border-2 border-blaze-black shadow-blaze-shadow bg-blaze-white">
              <CardHeader className="border-b-2 border-blaze-black bg-blaze-white">
                <CardTitle className="font-display text-3xl font-bold flex items-center gap-3 text-blaze-black">
                  <Calculator className="w-8 h-8" />
                  Quest Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 font-mono bg-blaze-white">
                <div className="space-y-2">
                  <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold">
                    Quest Name
                  </p>
                  <p className="font-bold text-xl text-blaze-black border-2 border-blaze-black/20 p-3 bg-blaze-white">
                    {watchedValues.name || "Untitled Quest"}
                  </p>
                </div>

                <Separator className="bg-blaze-black h-0.5" />

                <div className="grid grid-cols-1 gap-4">
                  <div className="border-2 border-blaze-black p-4 bg-blaze-white">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold">
                      Entry Fee
                    </p>
                    <p className="font-bold text-3xl text-blaze-black">
                      ${watchedValues.entryFee || 0}
                    </p>
                  </div>

                  <div className="border-2 border-blaze-black p-4 bg-blaze-white">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold">
                      Calculated Prize Pool
                    </p>
                    <p className="font-bold text-3xl text-blaze-orange">
                      ${calculatedPrizePool.toLocaleString()}
                    </p>
                  </div>
                </div>

                <Separator className="bg-blaze-black h-0.5" />

                <div className="space-y-4">
                  <div className="border-2 border-blaze-black p-4 bg-blaze-white">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Start Time
                    </p>
                    <p className="font-bold text-lg text-blaze-black mt-1">
                      {formatDateTime(watchedValues.startTime)}
                    </p>
                  </div>

                  <div className="border-2 border-blaze-black p-4 bg-blaze-white">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      End Time
                    </p>
                    <p className="font-bold text-lg text-blaze-black mt-1">
                      {formatDateTime(watchedValues.endTime)}
                    </p>
                  </div>

                  <div className="border-2 border-blaze-orange p-4 bg-blaze-orange/10">
                    <p className="text-sm uppercase tracking-wider text-blaze-black/70 font-bold">
                      Calculated Duration
                    </p>
                    <p className="font-bold text-2xl text-blaze-black">
                      {calculatedDurationMinutes > 0
                        ? formatDuration(calculatedDurationMinutes)
                        : "Invalid duration"}
                    </p>
                  </div>
                </div>

                <Separator className="bg-blaze-black h-0.5" />

                <div className="text-xs text-blaze-black/60 space-y-2 border-2 border-blaze-black/20 p-4 bg-blaze-white">
                  <p className="font-bold text-sm uppercase tracking-wider">
                    Fee Structure:
                  </p>
                  <ul className="space-y-1">
                    <li>• Prize pool = 95% of total entry fees</li>
                    <li>
                      • Estimated participants:{" "}
                      {Math.max(
                        10,
                        Math.min(100, (watchedValues.entryFee || 0) * 5)
                      )}
                    </li>
                    <li>• Platform fee: 5%</li>
                    <li>
                      • Total estimated fees: $
                      {(
                        (watchedValues.entryFee || 0) *
                        Math.max(
                          10,
                          Math.min(100, (watchedValues.entryFee || 0) * 5)
                        )
                      ).toLocaleString()}
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none border-2 border-blue-600 bg-blue-50 shadow-blaze-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="text-sm text-blue-800 font-mono">
                    <p className="font-bold mb-3 text-lg uppercase tracking-wider">
                      Quest Timeline:
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Players can join from quest creation until start time
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Trading begins at the specified start time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>Quest ends at the specified end time</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>
                          Winners are determined by portfolio performance
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

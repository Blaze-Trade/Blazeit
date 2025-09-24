import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { Wallet } from "lucide-react";
const questSchema = z.object({
  name: z.string().min(5, "Name must be at least 5 characters"),
  entryFee: z.coerce.number().min(0, "Entry fee must be 0 or more"),
  prizePool: z.coerce.number().min(1, "Prize pool must be at least 1"),
  duration: z.string().min(3, "Duration is required (e.g., 7 Days)"),
});
type QuestFormValues = z.infer<typeof questSchema>;
export function CreateQuestPage() {
  const navigate = useNavigate();
  const isConnected = usePortfolioStore((state) => state.isConnected);
  const form = useForm<QuestFormValues>({
    resolver: zodResolver(questSchema),
    defaultValues: {
      name: "",
      entryFee: 10,
      prizePool: 1000,
      duration: "7 Days",
    },
  });
  const onSubmit = async (values: QuestFormValues) => {
    try {
      await api("/api/quests", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Quest created successfully!");
      navigate("/quests");
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
        <p className="font-mono text-lg mt-2 max-w-md">You must connect your wallet to create a new quest.</p>
      </div>
    );
  }
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">CREATE QUEST</h1>
        <div className="border-2 border-blaze-black bg-blaze-white p-8 shadow-blaze-shadow">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 font-mono">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-bold uppercase tracking-wider">Quest Name</FormLabel>
                    <FormControl>
                      <Input className="h-14 text-lg border-2 border-blaze-black rounded-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="entryFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-bold uppercase tracking-wider">Entry Fee ($)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-14 text-lg border-2 border-blaze-black rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prizePool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xl font-bold uppercase tracking-wider">Prize Pool ($)</FormLabel>
                      <FormControl>
                        <Input type="number" className="h-14 text-lg border-2 border-blaze-black rounded-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xl font-bold uppercase tracking-wider">Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 7 Days, 24 Hours" className="h-14 text-lg border-2 border-blaze-black rounded-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px">
                {form.formState.isSubmitting ? "Creating..." : "Create Quest"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
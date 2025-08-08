import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ResponsePanel from "@/components/response-panel";
import { Send, Trash2, ThumbsUp } from "lucide-react";
import type { ChatSession } from "@shared/schema";

export default function ChatInterface() {
  const examples = [
    {
      prompt: "Hi Manny,\nI hope you are doing well during these crazy days. We have an offer for $252K with 3% down. Kathleen and David have agreed to it\nHave a great rest of your weekend. I appreciate your time.",
      response1: "Great news! Thanks for letting me know about the offer. $252K with 3% down sounds promising. I'll get started on the paperwork right away and reach out to the title company to begin the process.\n\nI'll need to verify a few details with Kathleen and David - their pre-approval letter and timeline preferences. Can we schedule a call tomorrow to go over the next steps?\n\nThanks for keeping me in the loop!\n\nBest,\nManny",
      response2: "Hi there,\n\nThanks for the update! This is excellent news - Kathleen and David are great clients and I'm glad they've agreed to the offer.\n\nLet me coordinate with the lender on the 3% down arrangement and make sure we have all the documentation lined up. I'll also reach out to the seller's agent to confirm acceptance and timeline.\n\nI'll keep you posted on the progress. Hope you have a great weekend too!\n\nManny"
    },
    {
      prompt: "Hi Manny,\nThe buyers want to close by the end of next month. They're offering full asking price at $485K. Can we move forward with the paperwork?\nThanks,\nJim",
      response1: "Hi Jim,\n\nAbsolutely! Full asking price at $485K is fantastic - let's get this moving immediately.\n\nI'll start preparing the purchase agreement today. Can you send me their pre-approval letter and preferred closing date? I'll also need to coordinate with the title company and schedule the inspection.\n\nEnd of next month gives us a good timeline to work with. I'll keep you updated every step of the way.\n\nTalk soon,\nManny",
      response2: "Jim,\n\nGreat news on the full asking price offer! Yes, we can definitely move forward with the paperwork.\n\nI'll get the contract drafted this afternoon and send it over for review. Let me know their exact preferred closing date so I can coordinate with all parties involved.\n\nI'll also reach out to the seller to confirm they're ready to proceed at $485K. This should be a smooth transaction.\n\nThanks for the update!\n\nManny"
    },
    {
      prompt: "Hi Manny,\nWe received the inspection report. Minor issues with plumbing and electrical. Buyers are still interested at $310K with seller covering repairs. Let me know next steps.\nRegards,\nMike",
      response1: "Hi Mike,\n\nThanks for the inspection update. Minor plumbing and electrical issues are pretty standard - glad the buyers are still committed at $310K.\n\nI'll draft a repair addendum today requesting the seller cover those items. Can you send me the specific details from the inspection report so I can be precise about what needs to be addressed?\n\nOnce I have that, I'll present it to the seller and we should be able to move forward quickly.\n\nManny",
      response2: "Mike,\n\nGood to hear the buyers are still interested! Minor repair items are totally manageable.\n\nI'll prepare the repair negotiation paperwork and reach out to the seller's agent about covering these costs. Given that they're minor issues, I'm optimistic the seller will agree to handle them.\n\nLet me get the ball rolling on this and I'll update you by tomorrow on the seller's response.\n\nBest,\nManny"
    },
    {
      prompt: "Hi Manny,\nCash offer came in today for $425K on the downtown property. No contingencies, 15-day close. Seller wants to accept.\nBest,\nLisa",
      response1: "Lisa,\n\nWow, a cash offer with no contingencies - that's exactly what we were hoping for! $425K on the downtown property is a great price.\n\nI'll prepare the acceptance paperwork immediately. Can you get me the buyer's proof of funds so we can move fast on this 15-day timeline?\n\nI'll coordinate with the title company today to make sure we can hit that closing date. This is going to be a smooth transaction!\n\nThanks for the great news,\nManny",
      response2: "Hi Lisa,\n\nFantastic! Cash offers are the best - especially with no contingencies and a quick close.\n\nThe seller will be thrilled with $425K. I'll get the purchase agreement prepared today and make sure we have everything lined up for the 15-day close.\n\nLet me know as soon as you have the buyer's financial verification and we can get this locked in. Great work bringing this offer in!\n\nManny"
    }
  ];
  
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [prompt, setPrompt] = useState(examples[0].prompt);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessionStats, setSessionStats] = useState({ total: 0, modelAWins: 0, modelBWins: 0 });
  const [modelARating, setModelARating] = useState(5);
  const [modelBRating, setModelBRating] = useState(5);
  const [modelAComment, setModelAComment] = useState("");
  const [modelBComment, setModelBComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitPromptMutation = useMutation({
    mutationFn: async () => {
      const currentExample = examples[currentExampleIndex];
      const response = await apiRequest("POST", "/api/chats", {
        prompt: currentExample.prompt,
        response1: currentExample.response1,
        response2: currentExample.response2,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data: ChatSession) => {
      setCurrentSession(data);
      // Move to next example for next analysis
      const nextIndex = (currentExampleIndex + 1) % examples.length;
      setCurrentExampleIndex(nextIndex);
      setPrompt(examples[nextIndex].prompt);
      setModelARating(5);
      setModelBRating(5);
      setModelAComment("");
      setModelBComment("");
      toast({
        title: "Success",
        description: "Document analysis completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const submitComparisonMutation = useMutation({
    mutationFn: async () => {
      const winner = modelARating >= modelBRating ? "modelA" : "modelB";
      const response = await apiRequest("POST", "/api/comparisons", {
        chatSessionId: currentSession?.id,
        winner,
        modelARating,
        modelBRating,
        modelAComment: modelAComment || undefined,
        modelBComment: modelBComment || undefined,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      const winner = modelARating >= modelBRating ? "modelA" : "modelB";
      setSessionStats(prev => ({
        total: prev.total + 1,
        modelAWins: prev.modelAWins + (winner === "modelA" ? 1 : 0),
        modelBWins: prev.modelBWins + (winner === "modelB" ? 1 : 0),
      }));
      toast({
        title: "Comparison Submitted",
        description: "Your ratings and comments have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/comparisons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit comparison. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitPromptMutation.mutate();
  };

  const handleClear = () => {
    setCurrentSession(null);
    setModelARating(5);
    setModelBRating(5);
    setModelAComment("");
    setModelBComment("");
  };

  const handleSubmitComparison = () => {
    if (!currentSession) return;
    submitComparisonMutation.mutate();
  };

  const handleExport = () => {
    const data = {
      sessionStats,
      currentSession,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document-analysis-results.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Prompt Input Section */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <Label className="block text-sm font-medium text-gray-700 mb-3">
            Legal Document to Analyze
          </Label>
          <form onSubmit={handleSubmit} className="flex space-x-4">
            <div className="flex-1">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none bg-gray-50"
                placeholder="Legal document content..."
                disabled={true}
                readOnly
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button 
                type="submit" 
                disabled={submitPromptMutation.isPending}
                className="px-6"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitPromptMutation.isPending ? "Analyzing..." : "Analyze Document"}
              </Button>
              <Button 
                type="button"
                variant="outline" 
                onClick={handleClear}
                className="px-6"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Comparison Panels */}
      <div className="flex-1 flex">
        <ResponsePanel
          title="Response 1"
          modelName="Legal Document Assistant"
          response={currentSession?.modelAResponse || null}
          isLoading={submitPromptMutation.isPending}
          onRate={setModelARating}
          onComment={setModelAComment}
          variant="blue"
          rating={modelARating}
          comment={modelAComment}
        />
        
        <ResponsePanel
          title="Response 2"
          modelName="Real Estate Legal Advisor"
          response={currentSession?.modelBResponse || null}
          isLoading={submitPromptMutation.isPending}
          onRate={setModelBRating}
          onComment={setModelBComment}
          variant="green"
          rating={modelBRating}
          comment={modelBComment}
        />
      </div>

      {/* Comparison Summary */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Session Comparisons</p>
                <p className="text-2xl font-bold text-gray-900">{sessionStats.total}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Response 1 Wins</p>
                <p className="text-2xl font-bold text-blue-600">{sessionStats.modelAWins}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Response 2 Wins</p>
                <p className="text-2xl font-bold text-green-600">{sessionStats.modelBWins}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {currentSession && (
                <Button 
                  onClick={handleSubmitComparison}
                  disabled={submitComparisonMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  {submitComparisonMutation.isPending ? "Submitting..." : "Submit Comparison"}
                </Button>
              )}
              <Button variant="outline" onClick={handleExport}>
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Export Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
      response1: "Dear Manny,\nThank you for providing the initial information regarding the property transaction. We are still missing some key details needed to complete the legal document:\n\nThe date of the legal document.\nThe address of the seller.\nThe address of the buyer.\nThe unit number of the property.\nThe square feet of the property.\nPlease provide this information at your earliest convenience to proceed.\nBest regards,\nMarion D. Houser",
      response2: "Dear Manny,\nThank you for providing the details so far. We are close to completing the document preparation, but we need a few more details to finalize everything:\n\nThe date of the legal document.\nThe address of the seller.\nThe name of the county.\nThe date of the deed to the seller.\nPlease provide this information at your earliest convenience so we can proceed.\nBest regards,\nMarion D. Houser\nHouser Properties\nBroker/Owner"
    },
    {
      prompt: "Hi Sarah,\nThe buyers want to close by the end of next month. They're offering full asking price at $485K. Can we move forward with the paperwork?\nThanks,\nJim",
      response1: "Dear Jim,\nI have reviewed the transaction details. To proceed with the closing documents, we need the following information:\n\nThe closing date.\nThe buyer's financing details.\nTitle company information.\nProperty survey requirements.\nHomeowner's insurance verification.\nPlease gather these documents so we can finalize the sale.\nBest regards,\nMarion D. Houser",
      response2: "Dear Jim,\nThank you for the update on the buyer's offer. We need to collect additional details before proceeding:\n\nThe exact closing date.\nThe buyer's pre-approval letter.\nThe escrow company details.\nThe property inspection results.\nPlease send these items when available.\nBest regards,\nMarion D. Houser\nHouser Properties\nBroker/Owner"
    },
    {
      prompt: "Hello,\nWe received the inspection report. Minor issues with plumbing and electrical. Buyers are still interested at $310K with seller covering repairs. Let me know next steps.\nRegards,\nMike",
      response1: "Dear Mike,\nThank you for the inspection update. To draft the repair addendum, I need:\n\nThe detailed inspection report.\nThe estimated repair costs.\nThe buyer's repair requests.\nThe seller's response timeline.\nProposed repair completion date.\nPlease provide these details to move forward.\nBest regards,\nMarion D. Houser",
      response2: "Dear Mike,\nI understand the buyers want to proceed with repairs covered by the seller. We need these details:\n\nThe complete inspection report.\nThe contractor estimates.\nThe repair negotiation terms.\nThe amended contract date.\nPlease send this information at your convenience.\nBest regards,\nMarion D. Houser\nHouser Properties\nBroker/Owner"
    },
    {
      prompt: "Hi Marion,\nCash offer came in today for $425K on the downtown property. No contingencies, 15-day close. Seller wants to accept.\nBest,\nLisa",
      response1: "Dear Lisa,\nExcellent news on the cash offer. For the purchase agreement, we need:\n\nProof of funds from buyer.\nThe proposed closing date.\nThe property legal description.\nThe earnest money amount.\nThe title company selection.\nPlease coordinate these items for swift processing.\nBest regards,\nMarion D. Houser",
      response2: "Dear Lisa,\nCash offers are always great to work with. Before we finalize, please provide:\n\nThe buyer's bank verification.\nThe exact closing timeline.\nThe property tax information.\nThe HOA details if applicable.\nPlease get these items together so we can proceed.\nBest regards,\nMarion D. Houser\nHouser Properties\nBroker/Owner"
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
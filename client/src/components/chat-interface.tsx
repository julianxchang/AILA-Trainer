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

// Extended interface to include response source information
interface EnhancedChatSession extends ChatSession {
  responseSource?: "api" | "simulated";
  isSimulated?: boolean;
  testCaseId?: string;
  agentResponseAId?: string;
  agentResponseBId?: string;
}

export default function ChatInterface() {
  const examples = [
    {
      prompt: "Subject: Need Legal Assistance for Property Purchase\nHi Manny,\nI'm in the process of making an offer on a condo located at 45 Beacon Street, Unit 3B, Boston, MA 02108. I'd like to have you represent me to review the purchase contract, ensure all terms are in my best interest, and guide me through the closing process.\nPlease let me know what information or documents you need from me to get started, as well as your availability for a quick call this week.\nThank you,\nRebecca Collins\n(617) 555-8241\nrebecca.collins@example.com",
    },
    {
      prompt: "Subject: Assistance with Selling My House\nHi Manny,\nI'm preparing to sell my house at 128 Elmwood Avenue, Cambridge, MA 02140. I'd like your assistance in reviewing the listing agreement, negotiating terms with the buyer, and handling all closing documents to make sure the transaction is smooth and compliant.\nPlease let me know your process, fees, and any initial information you need from me to proceed.\nLooking forward to hearing from you,\nDaniel Foster\n(781) 555-9137\ndaniel.foster@example.com",
    },
    {
      prompt: "Subject: Purchase Offer for 72 Seaview Avenue, Marblehead, MA 01945 – Attached\nHi Manny,\nI'm representing my client, Sarah Mitchell, in the purchase of 72 Seaview Avenue, Marblehead, MA 01945, and I've attached her signed offer for your review. Please confirm receipt and let me know if there are any issues or missing documents before we proceed.\nMy client is eager to move forward quickly, so your prompt feedback would be appreciated.\nThank you,\nMarion Blake\nLicensed Real Estate Broker\n(978) 555-4729\nmarion.blake@example.com\n[Attachment: Offer.pdf]",
    },
    {
      prompt: "Subject: Questions About Home Inspection Report – 45 Beacon Street, Boston\nHi Manny,\nI just received the inspection report for the condo at 45 Beacon Street, Unit 3B, and there are a few issues noted with the electrical system and roof. Could you review the report and let me know if these warrant requesting repairs or a price adjustment from the seller?\nThanks,\nLaura Hernandez\n(617) 555-3094\nlaura.hernandez@example.com",
    },
    {
      prompt: "Subject: Advice Needed on Competing Offers – 128 Elmwood Avenue, Cambridge\nHi Manny,\nWe've received two offers on our property, one with a higher price but more contingencies, and another with a lower price but all cash and no financing contingency. Could you help me weigh the pros and cons before I make a decision?\nBest,\nMichael Russo\n(781) 555-6218\nmichael.russo@example.com",
    },
    {
      prompt: "Subject: Title Issue Found – 72 Seaview Avenue, Marblehead\nHi Manny,\nThe title company mentioned there's an old lien on the property from a contractor in 2015. Can you explain how this might impact the closing and whether the seller is responsible for clearing it before we move forward?\nThank you,\nDavid Kim\n(978) 555-8473\ndavid.kim@example.com",
    },
    {
      prompt: "Subject: Closing Docs Needed – 19 Willow Lane, Lexington, MA 02420\nHi Manny,\nWe're scheduled to close on 19 Willow Lane, Lexington, MA 02420 this Friday, and the lender is requesting the final closing disclosure and deed draft today to stay on track. Could you confirm when these will be ready so I can coordinate with all parties?\nThanks,\nMarion Blake\nLicensed Real Estate Broker\n(978) 555-4729\nmarion.blake@example.com",
    },
    {
      prompt: "Subject: Walkthrough Problem – 72 Seaview Avenue, Marblehead\nHi Manny,\nDuring the final walkthrough today, we noticed that the seller removed the dining room chandelier, which was supposed to be included per the purchase agreement. How should we address this before closing tomorrow?\nBest,\nSarah Mitchell\n(978) 555-2214\nsarah.mitchell@example.com",
    },
    {
      prompt: "Subject: Financing Contingency Deadline – 19 Willow Lane, Lexington, MA\nHi Manny,\nMy lender just informed me that final underwriting on my mortgage for 19 Willow Lane, Lexington, MA 02420 may take an extra week. The financing contingency deadline in the purchase agreement is coming up in three days.\nCan you advise on whether we should request an extension now, and what happens if the loan isn't fully approved by the contingency date?\nThank you,\nEthan Wallace\n(617) 555-7625\nethan.wallace@example.com",
    }
  ];
  
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [prompt, setPrompt] = useState(examples[0].prompt);
  const [currentSession, setCurrentSession] = useState<EnhancedChatSession | null>(null);
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
      const response = await apiRequest("POST", "/api/evaluations", {
        prompt: currentExample.prompt,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data: EnhancedChatSession) => {
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
        description: data.isSimulated 
          ? "Document analysis completed using simulated responses"
          : "Document analysis completed using live API responses",
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
        evaluationSessionId: currentSession?.id,
        winner,
        modelARating,
        modelBRating,
        modelAComment: modelAComment || undefined,
        modelBComment: modelBComment || undefined,
        userId: user?.id,
        agentResponseAId: currentSession?.agentResponseAId,
        agentResponseBId: currentSession?.agentResponseBId,
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
                className="bg-gray-50"
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
          modelName="Response 1"
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
          modelName="Response 2"
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
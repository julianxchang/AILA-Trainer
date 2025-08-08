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
  const [prompt, setPrompt] = useState("Subject: Contract Review - Mutual Non-Disclosure Agreement\n\nDear Legal Team,\n\nI hope this email finds you well. I am writing to request your review of the attached Mutual Non-Disclosure Agreement (MNDA) that we have received from TechCorp Solutions for our upcoming collaboration on Project Alpha.\n\nKey areas I would like you to focus on:\n\n1. Duration and termination clauses\n2. Definition of confidential information\n3. Return or destruction of materials\n4. Governing law and jurisdiction\n5. Any unusual or concerning provisions\n\nThe proposed collaboration involves sharing our proprietary software development methodologies and they will be sharing their market research data. The project is expected to run for approximately 18 months.\n\nPlease let me know if you need any additional context or if you have any questions. I would appreciate your feedback by Friday so we can respond to TechCorp in a timely manner.\n\nBest regards,\nSarah Johnson\nBusiness Development Manager");
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
    mutationFn: async (promptText: string) => {
      const response = await apiRequest("POST", "/api/chats", {
        prompt: promptText,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: (data: ChatSession) => {
      setCurrentSession(data);
      setPrompt("");
      setModelARating(5);
      setModelBRating(5);
      setModelAComment("");
      setModelBComment("");
      toast({
        title: "Success",
        description: "AI responses generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to get AI responses. Please try again.",
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
    submitPromptMutation.mutate(prompt.trim());
  };

  const handleClear = () => {
    setPrompt("");
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
    a.download = "ai-comparison-results.json";
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
                rows={8}
                className="resize-none bg-gray-50"
                placeholder="Enter your legal question or prompt for AI model comparison..."
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
          modelName={currentSession?.modelAName || "Legal Analysis System"}
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
          modelName={currentSession?.modelBName || "Contract Review Assistant"}
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

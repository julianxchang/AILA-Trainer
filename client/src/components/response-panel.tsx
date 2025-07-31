import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, ThumbsUp, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsePanelProps {
  title: string;
  modelName: string;
  response: string | null;
  isLoading: boolean;
  onVote: () => void;
  onRate: (rating: number) => void;
  variant: "blue" | "green";
  chatSessionId?: string;
}

export default function ResponsePanel({
  title,
  modelName,
  response,
  isLoading,
  onVote,
  onRate,
  variant,
  chatSessionId,
}: ResponsePanelProps) {
  const [rating, setRating] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const submitComparisonMutation = useMutation({
    mutationFn: async (data: { winner: string; rating?: number }) => {
      const response = await apiRequest("POST", "/api/comparisons", {
        chatSessionId,
        winner: variant === "blue" ? "modelA" : "modelB",
        [variant === "blue" ? "modelARating" : "modelBRating"]: data.rating,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote recorded",
        description: "Your comparison has been saved successfully",
      });
    },
  });

  const handleVote = () => {
    if (!chatSessionId) return;
    
    setHasVoted(true);
    onVote();
    submitComparisonMutation.mutate({ 
      winner: variant === "blue" ? "modelA" : "modelB",
      rating: rating || undefined 
    });

    setTimeout(() => setHasVoted(false), 2000);
  };

  const handleRating = (newRating: number) => {
    setRating(newRating);
    onRate(newRating);
  };

  const variantClasses = {
    blue: {
      icon: "bg-blue-100 text-blue-600",
      button: "bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-300",
      voted: "bg-green-500 text-white",
    },
    green: {
      icon: "bg-green-100 text-green-600", 
      button: "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-300",
      voted: "bg-green-500 text-white",
    },
  };

  return (
    <div className="flex-1 bg-white border-r border-gray-200 last:border-r-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", variantClasses[variant].icon)}>
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{modelName}</p>
            </div>
          </div>
          <span className={cn("px-2 py-1 text-xs font-medium rounded-full", variantClasses[variant].icon)}>
            Active
          </span>
        </div>
      </div>
      
      {/* Response Content */}
      <div className="p-6 h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Generating response...</span>
          </div>
        ) : response ? (
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{response}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <p>Submit a prompt to see AI response</p>
          </div>
        )}
      </div>
      
      {/* Voting Section */}
      <div className="p-6 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Rate this response:</span>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6 hover:bg-transparent"
                  onClick={() => handleRating(star)}
                  disabled={!response}
                >
                  <Star 
                    className={cn(
                      "h-4 w-4 transition-colors",
                      star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    )}
                  />
                </Button>
              ))}
            </div>
          </div>
          <Button
            onClick={handleVote}
            disabled={!response || hasVoted}
            className={cn(
              "font-medium transition-all duration-200",
              hasVoted ? variantClasses[variant].voted : variantClasses[variant].button
            )}
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            {hasVoted ? "Selected!" : "Choose This"}
          </Button>
        </div>
      </div>
    </div>
  );
}

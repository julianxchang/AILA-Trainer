import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bot, ThumbsUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsePanelProps {
  title: string;
  modelName: string;
  response: string | null;
  isLoading: boolean;
  onRate: (rating: number) => void;
  onComment: (comment: string) => void;
  variant: "blue" | "green";
  rating: number;
  comment: string;
}

export default function ResponsePanel({
  title,
  modelName,
  response,
  isLoading,
  onRate,
  onComment,
  variant,
  rating,
  comment,
}: ResponsePanelProps) {

  const handleRating = (newRating: number[]) => {
    onRate(newRating[0]);
  };

  const handleCommentChange = (newComment: string) => {
    onComment(newComment);
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
      
      {/* Rating and Comment Section */}
      <div className="p-6 border-t border-gray-100 bg-gray-50 space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Rate this response (1-10):
          </Label>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">1</span>
            <Slider
              value={[rating]}
              onValueChange={handleRating}
              max={10}
              min={1}
              step={1}
              className="flex-1"
              disabled={!response}
            />
            <span className="text-sm text-gray-500">10</span>
            <span className="text-sm font-medium text-gray-900 w-6">
              {rating}
            </span>
          </div>
        </div>
        
        {/* Comment Section */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            Notes and Comments:
          </Label>
          <Textarea
            value={comment}
            onChange={(e) => handleCommentChange(e.target.value)}
            placeholder="Add your notes about this response..."
            className="resize-none"
            rows={3}
            disabled={!response}
          />
        </div>
      </div>
    </div>
  );
}

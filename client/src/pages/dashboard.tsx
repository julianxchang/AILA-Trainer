import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatInterface from "@/components/chat-interface";
import ResultsDashboard from "@/components/results-dashboard";
import { Scale, LogOut, MessageSquare, BarChart3 } from "lucide-react";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Scale className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AI Model Comparison</h1>
              <p className="text-sm text-gray-600">Legal Professional Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.firm}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Tabs defaultValue="chat" className="h-full">
          <div className="bg-white border-b border-gray-200 px-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-transparent p-0">
              <TabsTrigger 
                value="chat" 
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <MessageSquare className="h-4 w-4" />
                AI Comparison
              </TabsTrigger>
              <TabsTrigger 
                value="results"
                className="flex items-center gap-2 border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary rounded-none py-4"
              >
                <BarChart3 className="h-4 w-4" />
                Results Dashboard
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="chat" className="mt-0 h-full">
            <ChatInterface />
          </TabsContent>
          
          <TabsContent value="results" className="mt-0 h-full">
            <ResultsDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

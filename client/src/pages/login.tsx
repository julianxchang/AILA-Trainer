import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Scale, Eye, EyeOff, LogIn } from "lucide-react";

export default function Login() {
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [rememberToken, setRememberToken] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      login(token);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Model Comparison</h1>
            <p className="text-gray-600">Legal Professional Dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="jwtToken" className="block text-sm font-medium text-gray-700 mb-2">
                JWT Authentication Token
              </Label>
              <div className="relative">
                <Input
                  type={showToken ? "text" : "password"}
                  id="jwtToken"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full pr-10"
                  placeholder="Enter your JWT token"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberToken"
                checked={rememberToken}
                onCheckedChange={(checked) => setRememberToken(checked as boolean)}
              />
              <Label htmlFor="rememberToken" className="text-sm text-gray-700">
                Remember token
              </Label>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!token.trim()}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Access Dashboard
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Secure authentication for legal professionals
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

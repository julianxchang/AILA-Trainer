import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Clock, Trophy, Star, Download } from "lucide-react";

export default function ResultsDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch(`/api/stats?userId=${user?.id}`);
      return response.json();
    },
  });

  const { data: comparisons } = useQuery({
    queryKey: ["/api/comparisons"],
    queryFn: async () => {
      const response = await fetch(`/api/comparisons?userId=${user?.id}`);
      return response.json();
    },
  });

  const recentComparisons = comparisons?.slice(0, 5) || [];

  return (
    <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="text-blue-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Comparisons</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalComparisons || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ThumbsUp className="text-green-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageRating || "0"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.avgResponseTime || "0s"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Trophy className="text-orange-600 h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Preferred Model</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.preferredModel || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Model Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Model Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">GPT-4 Turbo</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${((stats?.modelAWins || 0) / Math.max((stats?.totalComparisons || 1), 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(((stats?.modelAWins || 0) / Math.max((stats?.totalComparisons || 1), 1)) * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Claude 3 Opus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${((stats?.modelBWins || 0) / Math.max((stats?.totalComparisons || 1), 1)) * 100}%` }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {Math.round(((stats?.modelBWins || 0) / Math.max((stats?.totalComparisons || 1), 1)) * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Comparisons */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Comparisons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentComparisons.length > 0 ? (
                recentComparisons.map((comparison: any, index: number) => (
                  <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        Comparison #{comparison.id?.slice(0, 8)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>{new Date(comparison.createdAt).toLocaleDateString()}</span>
                        {(comparison.modelARating || comparison.modelBRating) && (
                          <span className="flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {comparison.modelARating || comparison.modelBRating}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {comparison.winner === "modelA" ? "GPT-4" : "Claude"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No comparisons yet</p>
                  <p className="text-sm">Start comparing AI responses to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Comparison History</CardTitle>
              <div className="flex items-center space-x-3">
                <Select defaultValue="7days">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {comparisons && comparisons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comparison
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {comparisons.map((comparison: any) => (
                      <tr key={comparison.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Comparison #{comparison.id?.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {comparison.winner === "modelA" ? "GPT-4" : "Claude"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`h-3 w-3 ${star <= (comparison.modelARating || comparison.modelBRating || 0) ? 'fill-current' : ''}`} 
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {comparison.modelARating || comparison.modelBRating || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(comparison.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No comparison data available</p>
                <p className="text-sm">Start comparing AI responses to see detailed analytics here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

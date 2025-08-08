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
                  <p className="text-sm font-medium text-gray-600">Total Analysis</p>
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
                  <p className="text-sm font-medium text-gray-600">Preferred Response</p>
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
              <CardTitle className="text-lg">Response Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Response 1</span>
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
                  <span className="text-sm font-medium text-gray-700">Response 2</span>
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
              <CardTitle className="text-lg">Recent Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentComparisons.length > 0 ? (
                recentComparisons.map((comparison: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Analysis #{comparison.id?.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comparison.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                          Winner: {comparison.winner === "modelA" ? "Response 1" : "Response 2"}
                        </span>
                      </div>
                    </div>
                    
                    {/* Model Ratings Display */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-blue-600">Response 1</span>
                          {comparison.modelARating && (
                            <span className="text-sm font-semibold text-gray-900">
                              {comparison.modelARating}/10
                            </span>
                          )}
                        </div>
                        {comparison.modelAComment && (
                          <p className="text-xs text-gray-600 italic">
                            "{comparison.modelAComment}"
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-green-600">Response 2</span>
                          {comparison.modelBRating && (
                            <span className="text-sm font-semibold text-gray-900">
                              {comparison.modelBRating}/10
                            </span>
                          )}
                        </div>
                        {comparison.modelBComment && (
                          <p className="text-xs text-gray-600 italic">
                            "{comparison.modelBComment}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No analysis yet</p>
                  <p className="text-sm">Start analyzing legal documents to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Analysis History</CardTitle>
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
                        Analysis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winner
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response 1 Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Response 2 Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
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
                            Analysis #{comparison.id?.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {comparison.winner === "modelA" ? "Response 1" : "Response 2"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {comparison.modelARating ? (
                              <span className="font-medium">{comparison.modelARating}/10</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {comparison.modelBRating ? (
                              <span className="font-medium">{comparison.modelBRating}/10</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            {comparison.modelAComment && (
                              <div className="text-xs text-gray-600 mb-1">
                                <span className="font-medium text-blue-600">Response 1:</span> {comparison.modelAComment}
                              </div>
                            )}
                            {comparison.modelBComment && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium text-green-600">Response 2:</span> {comparison.modelBComment}
                              </div>
                            )}
                            {!comparison.modelAComment && !comparison.modelBComment && (
                              <span className="text-gray-400 text-xs">No notes</span>
                            )}
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
                <p className="text-lg font-medium">No analysis data available</p>
                <p className="text-sm">Start analyzing legal documents to see detailed analytics here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

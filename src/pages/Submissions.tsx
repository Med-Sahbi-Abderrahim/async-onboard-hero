import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useSubmissions, Submission } from "@/hooks/useSubmissions";
import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";
import { SubmissionDetails } from "@/components/submissions/SubmissionDetails";

export default function Submissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { submissions, loading, totalCount, totalPages } = useSubmissions({
    searchQuery,
    statusFilter,
    page,
    pageSize: 20,
  });

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSubmission(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Submissions</h2>
        <p className="text-muted-foreground mt-2">View and manage form submissions.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client name, email, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-muted-foreground">
          Showing {submissions.length} of {totalCount} submissions
        </div>
      )}

      {/* Table */}
      <SubmissionsTable
        submissions={submissions}
        loading={loading}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Drawer */}
      <SubmissionDetails
        submission={selectedSubmission}
        open={detailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

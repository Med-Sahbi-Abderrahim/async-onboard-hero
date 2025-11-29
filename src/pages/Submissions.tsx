import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileDown, FileUp, Inbox } from "lucide-react";
import { useSubmissions, Submission } from "@/hooks/useSubmissions";
import { useClientRequests } from "@/hooks/useClientRequests";
import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";
import { SubmissionDetails } from "@/components/submissions/SubmissionDetails";
import { ImportSubmissionsModal } from "@/components/submissions/ImportSubmissionsModal";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import { useOrgId } from "@/hooks/useOrgId";
import * as XLSX from "xlsx";

export default function Submissions() {
  const { toast } = useToast();
  const orgId = useOrgId();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const {
    submissions,
    loading: submissionsLoading,
    totalCount: submissionsCount,
    totalPages: submissionPages,
    refresh: refreshSubmissions,
  } = useSubmissions({
    searchQuery,
    statusFilter,
    page,
    pageSize: 20,
    orgId,
  });

  const { requests, loading: requestsLoading } = useClientRequests(orgId);

  // Combine submissions and client requests into a unified list
  const [combinedItems, setCombinedItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const loading = submissionsLoading || requestsLoading;

  useEffect(() => {
    // Transform client requests to match submission structure
    const transformedRequests = requests
      .filter((req) => {
        // Apply status filter
        if (statusFilter !== "all" && req.status !== statusFilter) return false;
        // Apply search filter
        if (searchQuery) {
          const search = searchQuery.toLowerCase();
          return (
            req.title.toLowerCase().includes(search) ||
            req.description?.toLowerCase().includes(search) ||
            req.request_type.toLowerCase().includes(search)
          );
        }
        return true;
      })
      .map((req) => ({
        ...req,
        type: "client_request",
        completion_percentage: req.status === "approved" ? 100 : req.status === "pending" ? 0 : 50,
        created_at: req.created_at,
        submitted_at: req.created_at,
      }));

    // Mark submissions with type
    const markedSubmissions = submissions.map((sub) => ({
      ...sub,
      type: "form_submission",
    }));

    // Combine and sort by creation date
    const combined = [...markedSubmissions, ...transformedRequests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    setCombinedItems(combined);
    setTotalCount(submissionsCount + transformedRequests.length);
    setTotalPages(Math.ceil((submissionsCount + transformedRequests.length) / 20));
  }, [submissions, requests, searchQuery, statusFilter, submissionsCount]);

  const refresh = () => {
    refreshSubmissions();
  };

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedSubmission(null);
  };

  const handleExportToExcel = () => {
    if (combinedItems.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no submissions to export",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = combinedItems.map((item) => {
        if (item.type === "client_request") {
          return {
            Type: "Client Request",
            ID: item.id,
            "Request Type": item.request_type,
            Title: item.title,
            Description: item.description || "",
            Status: item.status,
            Created: new Date(item.created_at).toLocaleDateString(),
          };
        } else {
          return {
            Type: "Form Submission",
            "Submission ID": item.id,
            "Client Name": item.client?.full_name || "",
            "Client Email": item.client?.email || "",
            Company: item.client?.company_name || "",
            Form: item.intake_form?.title || "",
            Status: item.status,
            Completion: `${item.completion_percentage}%`,
            Submitted: item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : "Not submitted",
            Created: new Date(item.created_at).toLocaleDateString(),
            // Add response fields
            ...item.responses,
          };
        }
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Submissions");

      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.min(
          maxWidth,
          Math.max(key.length, ...exportData.map((row) => String(row[key as keyof typeof row] || "").length)),
        ),
      }));
      worksheet["!cols"] = columnWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `submissions-export-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export successful",
        description: `Exported ${combinedItems.length} items to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportComplete = () => {
    setImportModalOpen(false);
    refresh();
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Submissions</h2>
          <p className="text-muted-foreground mt-2">View and manage clients submissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportToExcel} disabled={loading || combinedItems.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
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
      {!loading && combinedItems.length > 0 && (
        <div className="text-sm text-muted-foreground animate-fade-in">
          Showing {combinedItems.length} of {totalCount} submissions
        </div>
      )}

      {/* Table or Empty State */}
      {!loading && combinedItems.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={searchQuery || statusFilter !== "all" ? "No submissions found" : "No submissions yet"}
          description={
            searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Form submissions and client requests will appear here once clients start submitting them."
          }
        />
      ) : (
        <SubmissionsTable submissions={combinedItems} loading={loading} onViewDetails={handleViewDetails} />
      )}

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
      <SubmissionDetails submission={selectedSubmission} open={detailsOpen} onClose={handleCloseDetails} />

      {/* Import Modal */}
      <ImportSubmissionsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, FileDown, FileUp, Inbox } from "lucide-react";
import { useSubmissions, Submission } from "@/hooks/useSubmissions";
import { SubmissionsTable } from "@/components/submissions/SubmissionsTable";
import { SubmissionDetails } from "@/components/submissions/SubmissionDetails";
import { ImportSubmissionsModal } from "@/components/submissions/ImportSubmissionsModal";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/ui/empty-state";
import * as XLSX from 'xlsx';

export default function Submissions() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const { submissions, loading, totalCount, totalPages, refresh } = useSubmissions({
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

  const handleExportToExcel = () => {
    if (submissions.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no submissions to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Prepare data for export
      const exportData = submissions.map((submission) => ({
        'Submission ID': submission.id,
        'Client Name': submission.client?.full_name || '',
        'Client Email': submission.client?.email || '',
        'Company': submission.client?.company_name || '',
        'Form': submission.intake_form?.title || '',
        'Status': submission.status,
        'Completion': `${submission.completion_percentage}%`,
        'Submitted': submission.submitted_at
          ? new Date(submission.submitted_at).toLocaleDateString()
          : 'Not submitted',
        'Created': new Date(submission.created_at).toLocaleDateString(),
        // Add response fields
        ...submission.responses,
      }));

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');

      // Auto-size columns
      const maxWidth = 50;
      const columnWidths = Object.keys(exportData[0] || {}).map((key) => ({
        wch: Math.min(
          maxWidth,
          Math.max(
            key.length,
            ...exportData.map((row) => String(row[key as keyof typeof row] || '').length)
          )
        ),
      }));
      worksheet['!cols'] = columnWidths;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `submissions-export-${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      toast({
        title: 'Export successful',
        description: `Exported ${submissions.length} submissions to ${filename}`,
      });
    } catch (error: any) {
      toast({
        title: 'Export failed',
        description: error.message,
        variant: 'destructive',
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
          <p className="text-muted-foreground mt-2">View and manage form submissions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportToExcel} disabled={loading || submissions.length === 0}>
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
      {!loading && submissions.length > 0 && (
        <div className="text-sm text-muted-foreground animate-fade-in">
          Showing {submissions.length} of {totalCount} submissions
        </div>
      )}

      {/* Table or Empty State */}
      {!loading && submissions.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={searchQuery || statusFilter !== "all" ? "No submissions found" : "No submissions yet"}
          description={
            searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters or search query."
              : "Form submissions will appear here once clients start filling them out."
          }
        />
      ) : (
        <SubmissionsTable
          submissions={submissions}
          loading={loading}
          onViewDetails={handleViewDetails}
        />
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
      <SubmissionDetails
        submission={selectedSubmission}
        open={detailsOpen}
        onClose={handleCloseDetails}
      />

      {/* Import Modal */}
      <ImportSubmissionsModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { BrandedFooter } from "@/components/BrandedFooter";
import { AddMeetingModal } from "@/components/SharedModals";
import { useMeetings } from "@/hooks/useSharedData";
import { useClientData } from "@/hooks/useClientData";

export default function ClientPortalMeetings() {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const [showAddModal, setShowAddModal] = useState(false);
  const { client } = useClientData(orgId);
  const { meetings } = useMeetings(client?.id, client?.organization_id, true);

  const statusColors = {
    scheduled: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="min-h-screen gradient-hero p-4 md:p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 animate-slide-up">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="hover:scale-110 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">Meetings</h1>
            <p className="text-sm text-muted-foreground">Your scheduled meetings and calls</p>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="hover:scale-105 transition-transform">
            <Plus className="h-4 w-4 mr-2" />
            Add Meeting
          </Button>
        </div>

        <div className="space-y-4">
          {meetings.length === 0 ? (
            <Card
              className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10"
              style={{ animationDelay: "0.1s" }}
            >
              <CardContent className="text-center py-12 text-muted-foreground">
                <div className="rounded-full bg-primary/10 w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-10 w-10 text-primary/50" />
                </div>
                <p className="text-lg font-medium mb-1">No meetings scheduled</p>
                <p className="text-sm">Upcoming meetings will appear here</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting, index) => (
              <Card
                key={meeting.id}
                className="animate-slide-up bg-card/80 backdrop-blur-sm border-primary/10 hover:shadow-medium transition-all"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{meeting.title}</CardTitle>
                      </div>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{meeting.notes}</p>
                      )}
                    </div>
                    <Badge className={`${statusColors[meeting.status as keyof typeof statusColors]} shadow-soft`}>
                      {meeting.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">{new Date(meeting.scheduled_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Duration: {meeting.duration_minutes} minutes</p>
                      </div>
                    </div>
                    {meeting.meeting_link && (
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="w-full hover:scale-105 transition-transform shadow-soft"
                      >
                        <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                          Join Meeting
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {client && <BrandedFooter organizationId={client.organization_id} />}

      {showAddModal && client && (
        <AddMeetingModal
          clientId={client.id}
          organizationId={client.organization_id}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

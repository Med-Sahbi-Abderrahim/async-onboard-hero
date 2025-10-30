import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ClientPortalMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("client_id", user.id)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: true });

    if (error) {
      console.error("Error loading meetings:", error);
      return;
    }
    setMeetings(data || []);
  };

  const statusColors = {
    scheduled: "bg-blue-500",
    completed: "bg-green-500",
    cancelled: "bg-red-500",
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/client-portal")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Meetings</h1>
        </div>

        <div className="space-y-4">
          {meetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No meetings scheduled</p>
              </CardContent>
            </Card>
          ) : (
            meetings.map((meeting) => (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{meeting.title}</CardTitle>
                      {meeting.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{meeting.notes}</p>
                      )}
                    </div>
                    <Badge className={statusColors[meeting.status as keyof typeof statusColors]}>
                      {meeting.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm">
                        {new Date(meeting.scheduled_at).toLocaleString()} 
                        <span className="text-muted-foreground ml-2">
                          ({meeting.duration_minutes} minutes)
                        </span>
                      </p>
                    </div>
                    {meeting.meeting_link && (
                      <Button variant="outline" size="sm" asChild>
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
    </div>
  );
}

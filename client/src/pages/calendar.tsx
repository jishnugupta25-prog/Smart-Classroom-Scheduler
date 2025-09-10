import { Sidebar } from "@/components/layout/sidebar";
import { CalendarView } from "@/components/calendar/calendar-view";

export default function Calendar() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-card border-b border-border px-6 py-4">
          <h1 className="text-2xl font-semibold">Calendar View</h1>
          <p className="text-muted-foreground">View and manage classroom bookings</p>
        </header>

        <main className="flex-1 p-6">
          <CalendarView />
        </main>
      </div>
    </div>
  );
}

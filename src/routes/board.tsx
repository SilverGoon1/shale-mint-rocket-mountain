import { createFileRoute } from "@tanstack/react-router";
import { BoardStudio } from "@/components/board-studio";
import { SessionGate } from "@/components/guards";

export const Route = createFileRoute("/board")({ component: BoardPage });

function BoardPage() {
  return (
    <SessionGate needAdmin>
      {() => <BoardStudio />}
    </SessionGate>
  );
}

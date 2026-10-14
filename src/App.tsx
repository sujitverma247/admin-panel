import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"

export default function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <Button>Admin panel setup</Button>
      <p className="text-sm text-muted-foreground">Step 1 complete. Auth is not implemented yet.</p>
      <Toaster />
    </div>
  )
}

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BookOpen, LogOut, User as UserIcon } from "lucide-react";

export const HomePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-none">
                VIT Bhopal
              </span>
              <span className="text-xs text-blue-600 block font-medium">
                Knowledge Base
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <UserIcon className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-medium text-slate-800">
                {user?.name || user?.username}
              </span>
              {user?.registrationNumber && (
                <span className="text-xs text-slate-400 border-l border-slate-300 pl-2">
                  {user.registrationNumber}
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-slate-600 hover:text-red-600 hover:border-red-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 flex flex-col items-center justify-center">
        <Card className="w-full text-center border-slate-200 shadow-md p-8 sm:p-12">
          <CardHeader className="space-y-3 p-0 pb-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mx-auto mb-2">
              <BookOpen className="h-10 w-10" />
            </div>
            <CardTitle className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
              Hello World
            </CardTitle>
            <CardDescription className="text-lg text-slate-600 max-w-md mx-auto">
              Welcome to VIT Bhopal Knowledge Base,{" "}
              <span className="font-semibold text-blue-600">
                {user?.name || user?.username}
              </span>
              !
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              You are successfully authenticated. Question paper uploads, lecture notes,
              books, and our local LLM query assistant will be connected to this workspace next.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <div className="px-3 py-1.5 rounded-md bg-slate-100 text-xs font-mono text-slate-600">
                User ID: {user?.id}
              </div>
              <div className="px-3 py-1.5 rounded-md bg-emerald-50 text-xs font-mono text-emerald-700 font-semibold border border-emerald-200">
                Auth Status: Authenticated
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-400">
        VIT Bhopal University • Knowledge Base Portal
      </footer>
    </div>
  );
};

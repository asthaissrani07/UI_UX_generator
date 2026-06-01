"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "./project-card";
import type { ProjectType } from "@/types";

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get<ProjectType[]>("/api/project")
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20 pt-4 md:px-10">
      <h2
        className="animate-fade-in-up text-left font-heading text-xl font-light text-[#1a1a2e]"
        style={{ animationDelay: "0.42s" }}
      >
        My Projects
      </h2>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-[200px] w-full rounded-2xl" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d1d5db] bg-white/60 p-12 text-center text-sm text-[#9ca3af]">
          No projects yet. Create your first mockup above.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.projectId} project={p} />
          ))}
        </div>
      )}
    </section>
  );
}

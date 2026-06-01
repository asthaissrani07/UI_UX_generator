import Link from "next/link";
import Image from "next/image";
import type { ProjectType } from "@/types";

export default function ProjectCard({ project }: { project: ProjectType }) {
  const thumb = project.screenshot;
  const date = project.createdOn
    ? new Date(project.createdOn).toLocaleDateString()
    : "";

  return (
    <Link href={`/project/${project.projectId}`}>
      <article className="group cursor-pointer overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-lg">
        <div className="relative h-[200px] w-full bg-zinc-900">
          {thumb ? (
            <Image
              src={thumb}
              alt={project.projectName ?? "Project"}
              fill
              className="object-contain p-2"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No preview yet
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold truncate group-hover:text-primary">
            {project.projectName ?? "Untitled project"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
      </article>
    </Link>
  );
}

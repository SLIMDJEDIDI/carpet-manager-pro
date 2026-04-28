import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditDesignForm from "@/components/EditDesignForm";

export const dynamic = "force-dynamic";

export default async function EditDesignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const design = await prisma.design.findUnique({
    where: { id },
  });

  if (!design) {
    notFound();
  }

  // Serialize design for client component
  const serializedDesign = {
    id: design.id,
    code: design.code,
    name: design.name,
    imageUrl: design.imageUrl,
  };

  return <EditDesignForm design={serializedDesign} />;
}

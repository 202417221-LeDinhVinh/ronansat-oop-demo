import TestEngine from "@/components/TestEngine";

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <TestEngine testId={id} />;
}

import { CataloguePage } from "@/components/storefront/catalogue-page"

export default async function Page({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; return <CataloguePage title="Collection" initialCollection={slug}/> }

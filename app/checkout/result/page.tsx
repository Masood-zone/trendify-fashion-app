import { Suspense } from "react"
import { ResultPage } from "@/components/checkout/result-page"

export default function Page() { return <Suspense fallback={<div className="page-shell min-h-[60vh] animate-pulse"/>}><ResultPage/></Suspense> }

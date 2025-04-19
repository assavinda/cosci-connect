import React from "react"
import FreelanceCard from "../cards/FreelanceCard"
import Link from "next/link"

function FreelanceList() {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-8 gap-4">
        {/* freelance cards */}
        {Array.from({ length: 12 }).map((_, index) => (
            <Link key={index} href={`/user/${index}`}>
                <FreelanceCard/>
            </Link>
        ))}
    </section>
  )
}
export default FreelanceList
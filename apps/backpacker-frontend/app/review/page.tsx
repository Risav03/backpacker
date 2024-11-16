import CombinedReviewSearch from "@/components/review/reviewComponent"

export default function Home() {

  return (
    <div className="flex flex-col bg-white h-screen px-6 py-10 max-md:py-20 max-md:px-4">
      <div className="">
        <CombinedReviewSearch/>
      </div>
    </div>
  );
}

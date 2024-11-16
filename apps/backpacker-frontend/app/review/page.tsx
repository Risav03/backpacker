import { ReviewComponent } from "@/components/review/reviewComponent";

export default function Home() {

  return (
    <div className="flex flex-col items-center justify-start w-screen min-h-screen px-6 py-10 max-md:py-20 max-md:px-4">
      <div className="w-[50%] mx-auto">
        <ReviewComponent/>
      </div>
    </div>
  );
}

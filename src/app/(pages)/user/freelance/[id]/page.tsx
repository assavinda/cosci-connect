import HireButton from "../../../../components/buttons/HireButton"
import SendMessageButton from "../../../../components/buttons/SendMessageButton"

function FreelancerProfilePage({ params }: { params: { id: string } }) {
  return (
    <div>
        FreelancerProfilePage {params.id}
        <HireButton/>
        <SendMessageButton/>
    </div>
  )
}
export default FreelancerProfilePage
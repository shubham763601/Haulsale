// pages/become-seller.js
import SellerOnboardingForm from "../components/SellerOnboardingForm";

export default function BecomeSellerPage() {
  return (
    <div style={{background:"#f8fafc",minHeight:"100vh",padding:"40px 20px"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <SellerOnboardingForm />
      </div>
    </div>
  );
}
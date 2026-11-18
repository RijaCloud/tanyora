// @ts-nocheck
"use client";

// @ts-nocheck
const imgImagePetitesAnnonces = "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png";
const imgImagePetitesAnnonces1 = "/prototype-assets/0337cdfc0dd5585c501ac3fe250fd59647cff6a4.png";

export default function CardsAnnuaire() {
  return (
    <div className="bg-white relative rounded-[12px] size-full" data-name="Cards Annuaire">
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <div className="content-stretch flex flex-col gap-[20px] items-start p-[5px] relative size-full">
        <div className="h-[135px] relative rounded-[6px] shrink-0 w-full" data-name="Image petites annonces">
          <div aria-hidden="true" className="absolute bg-clip-padding border-0 border-[transparent] border-solid inset-0 pointer-events-none rounded-[6px]">
            <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces} />
            <img alt="" className="absolute bg-clip-padding border-0 border-[transparent] border-solid max-w-none object-cover rounded-[6px] size-full" src={imgImagePetitesAnnonces1} />
          </div>
        </div>
        <div className="relative shrink-0 w-full" data-name="Cards parent">
          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[20px] items-start p-[14px] relative w-full">
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="Profile">
              <div className="bg-[#22c55e] overflow-clip relative rounded-[30px] shrink-0 size-[35px]" data-name="Logo">
                <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Bold',sans-serif] justify-center leading-[0] left-[calc(50%-6.5px)] not-italic text-[15px] text-white top-1/2 whitespace-nowrap">
                  <p className="leading-[15px]">M</p>
                </div>
              </div>
              <div className="content-stretch flex items-center pb-[2px] relative shrink-0 w-[105px]" data-name="Container">
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[160px] min-h-px min-w-px overflow-clip relative" data-name="Container">
                  <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    <p className="leading-[normal] whitespace-pre-wrap">MADATECH Solutions</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
              <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#0a0a0a] text-[12px] w-[min-content]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Technologies de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢information et dÃƒÆ’Ã‚Â©veloppement de solutions digitales</p>
              </div>
              <div className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#737373] text-[0px] whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  25 employÃƒÆ’Ã‚Â©s
                </p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Container">
                <div className="flex flex-[1_0_0] flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-h-px min-w-px not-italic relative text-[#737373] text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[normal] whitespace-pre-wrap">13 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

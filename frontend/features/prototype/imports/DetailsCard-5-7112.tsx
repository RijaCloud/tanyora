// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import svgPaths from "./svg-qhpypei6xd";
const imgRectangle4859 = "/prototype-assets/e388b3b487144bf0b97682c8226be21145232187.png";
const imgRectangle4861 = "/prototype-assets/f2bff08276e075bb5d0107607824c330505608e3.png";
const imgRectangle4860 = "/prototype-assets/9a36b6791052b4ecb8899bd4ef2572e4622e7f9d.png";
const imgRectangle4862 = "/prototype-assets/cf7de16903d0e731cd216bce57e7bc1b25564985.png";
type Wrapper1Props = {
  additionalClassNames?: string;
};

function Wrapper1({ children, additionalClassNames = "" }: React.PropsWithChildren<Wrapper1Props>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] text-[12px]", additionalClassNames)}>
      {children}
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
};

function Wrapper({ children, additionalClassNames = "" }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] w-full", additionalClassNames)}>
      {children}
    </div>
  );
}

function Icon({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="absolute inset-[12.5%]">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.25 11.25">
        <g id="icon">{children}</g>
      </svg>
    </div>
  );
}

function IconFrame({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Icon Frame">{children}</g>
      </svg>
    </div>
  );
}
type Text3Props = {
  text: string;
};

function Text3({ text }: Text3Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[normal] text-[12px] whitespace-pre-wrap">
      {text}
    </p>
  );
}
type Text2Props = {
  text: string;
};

function Text2({ text }: Text2Props) {
  return (
    <Wrapper additionalClassNames="text-[0px]">
      <Text3 text={text} />
    </Wrapper>
  );
}
type HelperProps = {
  text: string;
  text1: string;
};

function Helper({ text, text1 }: HelperProps) {
  return (
    <div className="content-stretch flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[6px] items-start leading-[0] not-italic relative shrink-0 text-[#0a0a0a] w-full">
      <div className="flex flex-col justify-center relative shrink-0 text-[0px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <Text3 text={text} />
      </div>
      <div className="flex flex-col justify-center relative shrink-0 text-[12px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[normal] whitespace-pre-wrap">{text1}</p>
      </div>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <div className="bg-[#f2f2f2] content-stretch flex items-center justify-center px-[16px] py-[6px] relative rounded-[999px] shrink-0">
      <Wrapper1 additionalClassNames="whitespace-nowrap">
        <p className="leading-[normal]">{text}</p>
      </Wrapper1>
    </div>
  );
}
type TextProps = {
  text: string;
};

function Text({ text }: TextProps) {
  return (
    <Wrapper additionalClassNames="text-[12px]">
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </Wrapper>
  );
}

export default function DetailsCard() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start overflow-clip p-[24px] relative rounded-[24px] size-full" data-name="Details card">
      <div className="content-stretch flex flex-col gap-[24px] h-[881px] items-start relative shrink-0 w-full" data-name="Contents">
        <div className="content-start flex flex-wrap gap-[14px] items-start pointer-events-none relative shrink-0 w-[634px]" data-name="Gallery">
          <div className="h-[166px] relative rounded-[12px] shrink-0 w-[310px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4859} />
            <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[12px]" />
          </div>
          <div className="h-[166px] relative rounded-[12px] shrink-0 w-[310px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4861} />
            <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[12px]" />
          </div>
          <div className="h-[166px] relative rounded-[12px] shrink-0 w-[310px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4860} />
            <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[12px]" />
          </div>
          <div className="h-[166px] relative rounded-[12px] shrink-0 w-[310px]">
            <img alt="" className="absolute inset-0 max-w-none object-cover rounded-[12px] size-full" src={imgRectangle4862} />
            <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[12px]" />
          </div>
        </div>
        <div className="bg-white h-[89px] relative rounded-[16px] shrink-0 w-full" data-name="Header">
          <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[16px]" />
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-between p-[24px] relative size-full">
              <div className="content-stretch flex gap-[10px] items-start relative shrink-0 w-[150px]" data-name="Profile">
                <div className="bg-[#27624f] overflow-clip relative rounded-[30px] shrink-0 size-[35px]" data-name="Logo">
                  <div className="-translate-y-1/2 absolute flex flex-col font-['Acumin_Pro:Bold',sans-serif] justify-center leading-[0] left-[calc(50%-4.5px)] not-italic text-[15px] text-white top-[calc(50%+2px)] whitespace-nowrap">
                    <p className="leading-[15px]">A</p>
                  </div>
                </div>
                <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative self-stretch" data-name="Name/location">
                  <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center max-w-[160px] min-h-px min-w-px overflow-clip relative w-[105px]" data-name="Container">
                    <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#0a0a0a] text-[14px] w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">Perrichet</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative shrink-0" data-name="Interaction buttons">
                <div className="content-stretch flex gap-[8px] items-start relative">
                  <div className="bg-white content-stretch flex gap-[10px] h-[40px] items-center justify-center px-[20px] py-[10px] relative rounded-[6px] shrink-0" data-name="Button icon">
                    <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none rounded-[6px]" />
                    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="General / Favorite">
                      <IconFrame>
                        <g id="Base" />
                        <path
                          d="M21.435 6.582a5.54 5.54 0 00-7.84 0L12 8.177l-1.595-1.595a5.54 5.54 0 00-7.84 7.84l1.595 1.595L12 21.857l7.84-5.84 1.595-1.595a5.54 5.54 0 000-7.84z"
                          id="Vector"
                          fill="none"
                          stroke="var(--stroke-0, #292929)"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </IconFrame>
                    </div>
                  </div>
                  <div className="bg-white content-stretch flex gap-[10px] h-[40px] items-center justify-center px-[20px] py-[10px] relative rounded-[6px] shrink-0" data-name="Button icon">
                    <div aria-hidden="true" className="absolute border border-black border-solid inset-0 pointer-events-none rounded-[6px]" />
                    <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Communication / Share 2">
                      <IconFrame>
                        <g id="Base" />
                        <path d={svgPaths.p15f42100} id="Vector" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                        <path d={svgPaths.p3fda2700} id="Vector 137" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </IconFrame>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white relative rounded-[16px] shrink-0 w-full" data-name="Main Content">
          <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 pointer-events-none rounded-[16px]" />
          <div className="content-stretch flex flex-col items-start p-[24px] relative w-full">
            <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Content Section">
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-[383px]" data-name="Detail offre">
                <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#0a0a0a] text-[18px] w-[min-content]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[18px] whitespace-pre-wrap">Construction dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢un complexe administratif communal</p>
                </div>
                <Wrapper1 additionalClassNames="min-w-full w-[min-content] whitespace-pre-wrap">
                  <p className="mb-0">
                    <span className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      AX Company
                    </span>
                    <span className="leading-[normal]">{` lance un appel d'offres pour la construction d'un complexe administratif moderne. Ce projet d'envergure vise ÃƒÆ’Ã‚Â  centraliser les services municipaux, amÃƒÆ’Ã‚Â©liorant ainsi l'efficacitÃƒÆ’Ã‚Â© administrative et l'accueil des citoyens. Les entreprises intÃƒÆ’Ã‚Â©ressÃƒÆ’Ã‚Â©es sont invitÃƒÆ’Ã‚Â©es ÃƒÆ’Ã‚Â  soumettre leurs propositions dÃƒÆ’Ã‚Â©taillÃƒÆ’Ã‚Â©es, incluant plans, budget et ÃƒÆ’Ã‚Â©chÃƒÆ’Ã‚Â©ancier. Une attention particuliÃƒÆ’Ã‚Â¨re sera accordÃƒÆ’Ã‚Â©e aux solutions innovantes et durables. `}</span>
                  </p>
                  <p className="leading-[normal] mb-0">&nbsp;</p>
                  <p className="leading-[normal] mb-0">{`Le complexe devra intÃƒÆ’Ã‚Â©grer des espaces de travail collaboratifs, des bureaux individuels, des salles de rÃƒÆ’Ã‚Â©union modulables et un espace d'accueil spacieux et lumineux. La date limite de soumission des offres est fixÃƒÆ’Ã‚Â©e au 15 mars 2024. `}</p>
                  <p className="leading-[normal] mb-0">&nbsp;</p>
                  <p className="leading-[normal]">Un dossier complet est disponible auprÃƒÆ’Ã‚Â¨s du service des marchÃƒÆ’Ã‚Â©s publics de la ville.</p>
                </Wrapper1>
                <div className="content-stretch flex gap-[12px] items-start relative shrink-0" data-name="Tags">
                  <Text1 text="livraison" />
                  <Text1 text="propriÃƒÆ’Ã‚Â©taire" />
                </div>
              </div>
              <div className="flex h-[322px] items-center justify-center relative shrink-0 w-0" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19.078125" } as React.CSSProperties}>
                <div className="flex-none rotate-90">
                  <div className="h-0 relative w-[322px]">
                    <div className="absolute inset-[-1px_0_0_0]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 322 1">
                        <line id="Line 1" stroke="var(--stroke-0, #F2F2F2)" x2="322" y1="0.5" y2="0.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[23px] items-start pt-[28px] relative shrink-0 w-[169px]" data-name="Job Details">
                <div className="content-stretch flex flex-col gap-[15px] items-start relative shrink-0 w-full" data-name="Job Details Container">
                  <Helper text="Lieu" text1="Ivandry" />
                  <Helper text="Date de publication" text1="19 fÃƒÆ’Ã‚Â©vrier 2026" />
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Contact Container">
                    <Text2 text="Contact" />
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Contact Value Container">
                      <Text text="+261 31 00 000 00" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Email Container">
                    <Text2 text="Mail" />
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Email Value Container">
                      <Text text="votremail@gmail.com" />
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col gap-[6px] items-start relative shrink-0 w-full" data-name="Social Media Container">
                    <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[#0a0a0a] text-[0px] w-[min-content]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <Text3 text="RÃƒÆ’Ã‚Â©seaux Sociaux" />
                    </div>
                    <div className="content-stretch flex gap-[6px] items-start relative shrink-0" data-name="Icones">
                      <div className="relative shrink-0 size-[15px]" data-name="facebook">
                        <Icon>
                          <path d={svgPaths.p1beb440} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector_2" />
                        </Icon>
                      </div>
                      <div className="relative shrink-0 size-[15px]" data-name="instagram">
                        <Icon>
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p2d39fa00} fill="var(--fill-0, #212121)" id="Vector_2" />
                          <path d={svgPaths.pef92af0} fill="var(--fill-0, #212121)" id="Vector_3" />
                        </Icon>
                      </div>
                      <div className="relative shrink-0 size-[15px]" data-name="linkedin">
                        <Icon>
                          <path d={svgPaths.p368e3580} fill="var(--fill-0, #212121)" id="Vector" />
                          <path d={svgPaths.p3ea864f0} fill="var(--fill-0, #212121)" id="Vector_2" />
                        </Icon>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-[#2563eb] h-[40px] relative rounded-[6px] shrink-0 w-full" data-name="Button Primary">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="content-stretch flex gap-[10px] items-center justify-center px-[20px] py-[10px] relative size-full">
                      <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                        <p className="leading-[14px]">Contacter</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

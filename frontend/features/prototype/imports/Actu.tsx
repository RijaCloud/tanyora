// @ts-nocheck
"use client";

// @ts-nocheck
import clsx from "clsx";
import { useNavigate } from "@/features/prototype/router-compat";
import svgPaths from "./svg-zx5x69jx5s";
const imgImage1 = "/prototype-assets/95c2c9e835fb2d55de17370220fb31a3ba680150.png";
const imgLogo = "/prototype-assets/e0b8fdce2f20341a9b9db533fab8dddf4e5f06f9.png";
const imgAds3 = "/prototype-assets/0c81bdc5da5af2c126817a91e92fcc5d963eb4c6.png";
const imgAds02 = "/prototype-assets/5b10018d9d1c3cba1693af46cf071bfb676ebdee.png";
const imgAds4 = "/prototype-assets/f7f85b12cbfa7c7b47238d957537b7e5b33be8e5.png";
const imgImageActu = "/prototype-assets/ece298d0ec2c16f10310d45724b276a6035cb503.png";
const imgImageActu1 = "/prototype-assets/2983b351bc9da3ebd071b56165157142049c227f.png";
const imgImageActu2 = "/prototype-assets/906f2fbd69293046e8a8a41d372e36eea0b50839.png";
const imgImageActuCompliment2 = "/prototype-assets/f4d703183e029a85c14017b6dff9096e3d6a15ac.png";
const imgImageActuCompliment3 = "/prototype-assets/7032e5a8a0182871d757f1297d98e27d6ec8b179.png";
const imgImageActuCompliment4 = "/prototype-assets/b8289531001a0beb11ba0891ffe4ced6d8defd06.png";
const imgImageActu3 = "/prototype-assets/442bcff8ec564ea67dee2d8bc5ffc48d2710820b.png";
const imgImageActu4 = "/prototype-assets/33056c934b074c7b641ef3622dd3931b9f33fd39.png";
const imgImageActuCompliment5 = "/prototype-assets/7fbd9ceb038ec3993ab8ccf8147fdd78c15ca3b8.png";
const imgVideoCard = "/prototype-assets/c8771a9519bacaa7c994fa662d27d0b0c5735248.png";
type Text9Props = {
  text: string;
  additionalClassNames?: string;
};

function Text9({ text, additionalClassNames = "" }: Text9Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("-translate-y-1/2 absolute flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold h-[17px] justify-center left-0 text-[12px] top-[14.5px] w-[143.92px]", additionalClassNames)}>
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type Text8Props = {
  text: string;
};

function Text8({ text }: Text8Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#27624f] text-[16px] uppercase w-full">
      <p className="leading-[normal] whitespace-pre-wrap">{text}</p>
    </div>
  );
}
type Text2Props = {
  text: string;
  additionalClassNames?: string;
};

function Text2({ text, additionalClassNames = "" }: Text2Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[12px] w-full", additionalClassNames)}>
      <span className="inline-block px-2 py-1 bg-[#27624f] text-white text-[10px] rounded leading-[normal]">2424 RDV</span>
    </div>
  );
}

function Wrapper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:Light',sans-serif] font-light h-[12.5px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] text-right w-full">
      {children}
    </div>
  );
}
type ComplimentInfoCardsProps = {
  additionalClassNames?: string;
};

function ComplimentInfoCards({ children, additionalClassNames = "" }: React.PropsWithChildren<ComplimentInfoCardsProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="content-stretch flex flex-col gap-[20px] items-start relative w-full">{children}</div>
    </div>
  );
}
type WrapperProps = {
  additionalClassNames?: string;
  onClick?: () => void;
};

function Wrapper({ children, additionalClassNames = "", onClick }: React.PropsWithChildren<WrapperProps>) {
  return (
    <div
      className={clsx("relative rounded-[12px] shrink-0", additionalClassNames, onClick ? "cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1" : "")}
      onClick={onClick}
    >
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        {children}
      </div>
    </div>
  );
}

function HeaderFreeUserDropdownIcon({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[12.632px]">
      <div className="absolute inset-[28.63%_10.51%_28.75%_10.51%]" data-name="Group">
        {children}
      </div>
    </div>
  );
}

function HeaderFreeUserHelper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center size-full">
      <div className="content-stretch flex items-center justify-between px-[4px] py-[2px] relative size-full">{children}</div>
    </div>
  );
}

function FooterHelper1({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex items-center justify-center p-[10px] relative size-full">{children}</div>
    </div>
  );
}

function FooterHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex flex-row items-center justify-center size-full">
      <div className="content-stretch flex h-full items-center justify-center p-[10px] relative">{children}</div>
    </div>
  );
}
type HeadlineProps = {
  additionalClassNames?: string;
};

function Headline({ children, additionalClassNames = "" }: React.PropsWithChildren<HeadlineProps>) {
  return (
    <div className={clsx("relative shrink-0", additionalClassNames)}>
      <div className="content-stretch flex flex-col gap-[14px] items-start relative w-full">{children}</div>
    </div>
  );
}

function Ads03Ads({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="flex-[1_0_0] h-[283px] min-h-px min-w-px relative rounded-[12px]">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
        <div className="absolute bg-[#27624f] inset-0 rounded-[12px]" />
        <div className="absolute inset-0 overflow-hidden rounded-[12px]">{children}</div>
      </div>
      <div className="flex flex-col items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex flex-col items-center justify-center size-full" />
      </div>
    </div>
  );
}

function HeaderFreeUserHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[24px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[24px] top-1/2" data-name="Icon Frame">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Icon Frame">{children}</g>
        </svg>
      </div>
    </div>
  );
}
type NavFiltreCategorieChevronLeftProps = {
  additionalClassNames?: string;
};

function NavFiltreCategorieChevronLeft({ children, additionalClassNames = "" }: React.PropsWithChildren<NavFiltreCategorieChevronLeftProps>) {
  return (
    <div className={clsx("overflow-clip relative size-[16px]", additionalClassNames)}>
      <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-1/4" data-name="Icon">
        <div className="absolute inset-[-12.5%_-25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6 10">
            {children}
          </svg>
        </div>
      </div>
    </div>
  );
}

function InteractionHelper({ children }: React.PropsWithChildren<{}>) {
  return (
    <div className="overflow-clip relative shrink-0 size-[15px]">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[15px] top-1/2" data-name="Icon Frame">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15 15">
          <g id="Icon Frame">{children}</g>
        </svg>
      </div>
    </div>
  );
}
type ContentsTextProps = {
  text: string;
};

function ContentsText({ text }: ContentsTextProps) {
  return (
    <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full">
      <p className="font-['Georgia:Bold',sans-serif] leading-[14px] min-w-full not-italic relative shrink-0 text-[#121212] text-[12px] w-[min-content] whitespace-pre-wrap">{text}</p>
      <Interaction className="relative shrink-0" />
    </div>
  );
}

function LeftContent() {
  return (
    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0">
      <Headline1 className="relative shrink-0 w-[280px]" />
      <HorizontalDivider />
      <Headline additionalClassNames="w-[280px]">
        <Type className="bg-[#27624f] h-[17px] relative rounded-[999px] shrink-0" />
        <BolgTexte text="La SADC justifie auprÃƒÆ’Ã‚Â¨s de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine son choix de ne pas suspendre Madagascar de ses organes" text1="Une dÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©gation malgache a bien ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© prÃƒÆ’Ã‚Â©sente ÃƒÆ’Ã‚Â  Addis Abeba ce weekend. Bien que Madagascar nÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ait pas participÃƒÆ’Ã‚Â© aux travaux du 39ÃƒÆ’Ã‚Â¨me Sommet des chefs dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Etat et de gouvernement de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine, la ministre des Affaires ÃƒÆ’Ã‚Â©trangÃƒÆ’Ã‚Â¨res, Christine Razanamahasoa, a pu avoir quelques rencontres officielles sur place. Elle a, entre autres, ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© reÃƒÆ’Ã‚Â§ue par Mahmoud Ali Youssouf, prÃƒÆ’Ã‚Â©sident de la Commission de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine en marge du Sommet, ce lundi. Dimanche, elle a pu avoir une audience avec son homologue djiboutien, Abdoulkader Houssein Omar." />
        <Interaction className="relative shrink-0" />
      </Headline>
    </div>
  );
}
type ListTextProps = {
  text: string;
};

function ListText({ text }: ListTextProps) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col justify-center relative shrink-0 text-[0px]">
      <p className="leading-[normal] text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
    </div>
  );
}
type NavActuContentTextProps = {
  text: string;
};

function NavActuContentText({ text }: NavActuContentTextProps) {
  return (
    <div className="bg-white h-[30px] overflow-auto relative shrink-0 w-[793px]">
      <Text9 text={text} additionalClassNames="leading-[0] not-italic text-[#121212]" />
    </div>
  );
}

function HorizontalDivider1() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#121212] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function VerticalDivider() {
  return (
    <div className="h-[419px] relative shrink-0 w-px">
      <div aria-hidden="true" className="absolute border-[#dfdfdf] border-l border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function HorizontalDivider() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid inset-0 pointer-events-none" />
    </div>
  );
}
type NavFiltreCategorieTextProps = {
  text: string;
  additionalClassNames?: string;
};

function NavFiltreCategorieText({ text, additionalClassNames = "" }: NavFiltreCategorieTextProps) {
  return (
    <div className={clsx("content-stretch flex items-center relative shrink-0 cursor-pointer group", additionalClassNames)}>
      <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] not-italic relative shrink-0 text-[12px] text-black pb-1 transition-colors duration-300 ease-in-out group-hover:text-[#27624f]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
      <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#27624f] transition-all duration-300 ease-in-out group-hover:w-full"></span>
    </div>
  );
}
type Helper1Props = {
  additionalClassNames?: string;
};

function Helper1({ additionalClassNames = "" }: Helper1Props) {
  return (
    <div className={clsx("content-stretch flex gap-[19px] items-center justify-center relative", additionalClassNames)}>
      <div className="relative shrink-0 size-[29.978px]" data-name="Union">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 29.9785 29.9785">
          <path d={svgPaths.p3aad7d00} fill="var(--fill-0, white)" id="Union" />
        </svg>
      </div>
      <Text4 text="Votre Pub ICI" additionalClassNames="text-[25.556px] text-white" />
    </div>
  );
}

function Helper() {
  return (
    <div className="content-stretch flex flex-col gap-[14px] items-start relative w-full">
      <Type className="bg-[#27624f] h-[17px] relative rounded-[999px] shrink-0" />
      <BolgTexte text="Mahmoud Ali Youssouf reÃƒÆ’Ã‚Â§oit Christine Razanamahasoa en marge du Sommet de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine ÃƒÆ’Ã‚Â  Addis-Abeba" text1="Une dÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©gation malgache a bien ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© prÃƒÆ’Ã‚Â©sente ÃƒÆ’Ã‚Â  Addis Abeba ce weekend. Bien que Madagascar nÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ait pas participÃƒÆ’Ã‚Â© aux travaux du 39ÃƒÆ’Ã‚Â¨me Sommet des chefs dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Etat et de gouvernement de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine, la ministre des Affaires ÃƒÆ’Ã‚Â©trangÃƒÆ’Ã‚Â¨res, Christine Razanamahasoa, a pu avoir quelques rencontres officielles sur place. Elle a, entre autres, ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© reÃƒÆ’Ã‚Â§ue par Mahmoud Ali Youssouf, prÃƒÆ’Ã‚Â©sident de la Commission de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine en marge du Sommet, ce lundi. Dimanche, elle a pu avoir une audience avec son homologue djiboutien, Abdoulkader Houssein Omar." />
      <Interaction className="relative shrink-0" />
    </div>
  );
}
type BolgTexteProps = {
  text: string;
  text1: string;
};

function BolgTexte({ text, text1 }: BolgTexteProps) {
  const navigate = useNavigate();

  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full">
      <Profile />
      <p
        className="font-['Georgia:Bold',sans-serif] leading-none min-w-full not-italic relative shrink-0 text-[#121212] text-[18px] w-[min-content] whitespace-pre-wrap cursor-pointer hover:text-[#27624f] transition-colors duration-300"
        onClick={() => navigate('/article/1')}
      >
        {text}
      </p>
      <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[14px] min-w-full not-italic overflow-hidden relative shrink-0 text-[#5a5a5a] text-[12px] text-ellipsis w-[min-content] whitespace-pre-wrap line-clamp-2" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text1}
      </p>
      <button
        onClick={() => navigate('/article/1')}
        className="text-[#27624f] text-[12px] font-['Roboto_Flex:Regular',sans-serif] font-normal relative inline-block after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-[#27624f] after:left-0 after:bottom-0 after:transition-all after:duration-300 hover:after:w-full transition-all cursor-pointer"
        style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
      >
        Lire la suite ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
      </button>
    </div>
  );
}
type ProfileProps = {
  additionalClassNames?: string;
};

function Profile({ additionalClassNames = "" }: ProfileProps) {
  return (
    <div className="content-stretch flex gap-[10px] items-start relative shrink-0">
      <div className="relative rounded-[930.39px] shrink-0 size-[25px]" data-name="Logo">
        <Image additionalClassNames="pointer-events-none" />
      </div>
      <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" />
    </div>
  );
}
type Text7Props = {
  text: string;
  additionalClassNames?: string;
};

function Text7({ text, additionalClassNames = "" }: Text7Props) {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start not-italic relative shrink-0 w-full whitespace-pre-wrap">
      <p
        className="font-['Georgia:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] w-full cursor-pointer hover:text-[#27624f] transition-colors duration-300"
        onClick={() => {
          const navigate = (window as any).__navigate__;
          if (navigate) navigate('/article/1');
        }}
      >
        {text}
      </p>
      <Text text="Une autre facette de Joely se dÃƒÆ’Ã‚Â©voilera au public malgache ce mois de fÃƒÆ’Ã‚Â©vrier. Mais ce ne sera pas un nouveau personnage." additionalClassNames="leading-[14px] text-[#5a5a5a]" />
    </div>
  );
}
type Text6Props = {
  text: string;
};

function Text6({ text }: Text6Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col justify-center relative shrink-0 text-[10px]">
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type Text5Props = {
  text: string;
};

function Text5({ text }: Text5Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="flex flex-col font-['Roboto_Flex:SemiBold',sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] text-black whitespace-nowrap">
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type Text4Props = {
  text: string;
  additionalClassNames?: string;
};

function Text4({ text, additionalClassNames = "" }: Text4Props) {
  return (
    <div style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 uppercase whitespace-nowrap", additionalClassNames)}>
      <p className="leading-[normal]">{text}</p>
    </div>
  );
}
type Text3Props = {
  text: string;
};

function Text3({ text }: Text3Props) {
  return (
    <div className="content-stretch flex flex-col gap-[2px] items-start justify-center leading-[0] not-italic relative shrink-0 text-black whitespace-nowrap">
      <div className="flex flex-col font-['Roboto_Flex:Regular',sans-serif] font-normal justify-center relative shrink-0 text-[10px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[normal]">{`Tanyora ActualitÃƒÆ’Ã‚Â© & Reportages`}</p>
      </div>
      <div className="flex flex-col font-['Roboto_Flex:Light',sans-serif] font-light justify-center relative shrink-0 text-[8px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        <p className="leading-[normal]">{text}</p>
      </div>
    </div>
  );
}
type ImageProps = {
  additionalClassNames?: string;
};

function Image({ additionalClassNames = "" }: ImageProps) {
  return (
    <div aria-hidden="true" className={clsx("absolute inset-0 rounded-[930.39px]", additionalClassNames)}>
      <div className="absolute bg-white inset-0 rounded-[930.39px]" />
      <div className="absolute inset-0 overflow-hidden rounded-[930.39px]">
        <img alt="" className="absolute h-[63.45%] left-[18.51%] max-w-none top-[18.4%] w-[63.58%]" src={imgLogo} />
      </div>
    </div>
  );
}

function LogoImage() {
  return (
    <div className="pointer-events-none relative rounded-[930.39px] shrink-0 size-[25px]">
      <Image />
      <div aria-hidden="true" className="absolute border border-[#f2f2f2] border-solid inset-0 rounded-[930.39px]" />
    </div>
  );
}
type FooterLinksProps = {
  text: string;
  text1: string;
  text2: string;
  text3: string;
  text4: string;
  text5: string;
  text6: string;
  text7: string;
  text8: string;
};

function FooterLinks({ text, text1, text2, text3, text4, text5, text6, text7, text8 }: FooterLinksProps) {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[90px]">
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text1}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text2}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text3}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text4}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text5}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text6}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text7}
      </p>
      <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
        {text8}
      </p>
    </div>
  );
}
type Text1Props = {
  text: string;
};

function Text1({ text }: Text1Props) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#525252] w-full whitespace-pre-wrap">
      {text}
    </p>
  );
}
type TextProps = {
  text: string;
  additionalClassNames?: string;
};

function Text({ text, additionalClassNames = "" }: TextProps) {
  return (
    <p style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }} className={clsx("font-['Roboto_Flex:Regular',sans-serif] font-normal relative shrink-0 text-[12px] w-full", additionalClassNames)}>
      {text}
    </p>
  );
}
type FooterProps = {
  className?: string;
  property1?: "Dark" | "Light";
};

function Footer({ className, property1 = "Dark" }: FooterProps) {
  const isLight = property1 === "Light";
  return (
    <div className={className || `h-[493px] relative w-[1440px] ${isLight ? "bg-white" : "bg-[#0a0a0a]"}`}>
      <div className="flex flex-col items-center size-full">
        <div className="content-stretch flex flex-col gap-[60px] items-center px-[144px] relative size-full">
          <div className="h-0 relative shrink-0 w-[1207px]">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1207 1">
                <line id="Line 3" stroke="var(--stroke-0, #E5E5E5)" x2="1207" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
          <div className="content-stretch flex items-start justify-between relative shrink-0 w-full" data-name="Footer contents">
            <div className="content-stretch flex flex-col gap-[19px] items-start relative shrink-0 w-[242px]">
              <div className="aspect-[247/59] relative shrink-0 w-full" data-name="image 1">
                <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage1} />
              </div>
              <div className={`flex flex-col font-["Roboto_Flex:Regular",sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[12px] w-full ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">
                  {`Tanyora est un site web promu par UNITED MALAGASY MEDIA, visant ÃƒÆ’Ã‚Â  produire des contenus de qualitÃƒÆ’Ã‚Â© aussi bien dans l'actualitÃƒÆ’Ã‚Â© quotidienne ou sous forme de reportages. Consultez la page dÃƒÆ’Ã‚Â©diÃƒÆ’Ã‚Â©e pour plus d'informations.`}
                  <br aria-hidden="true" />
                  <br aria-hidden="true" />
                </p>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[19px] items-start relative shrink-0 w-[90px]" data-name="Categories">
              <div className={`flex flex-col font-["Roboto_Flex:SemiBold",sans-serif] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[12px] w-full ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Menu</p>
              </div>
              <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Links categories">
                <div className={`content-stretch flex flex-col font-["Roboto_Flex:Regular",sans-serif] font-normal gap-[8px] items-start leading-[normal] not-italic relative shrink-0 text-[10px] w-[82px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} data-name="Links 01">
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Accueil
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    ActualitÃƒÆ’Ã‚Â©s
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Petites Annonces
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Appel dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Offres
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Offres dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢emploi
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Web Radio
                  </p>
                  <p className="relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Annuaire
                  </p>
                </div>
              </div>
            </div>
            <div className={`content-stretch flex flex-col gap-[19px] items-start not-italic relative shrink-0 ${isLight ? "text-[#0a0a0a]" : "text-white"}`} data-name="Categories">
              <Text2 text="Categories" />
              <div className="content-stretch flex font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[50px] items-start leading-[normal] relative shrink-0 text-[10px] w-full whitespace-pre-wrap" data-name="Links categories">
                <FooterLinks text="ÃƒÆ’Ã¢â€šÂ¬ la une" text1="ActualitÃƒÆ’Ã‚Â©" text2="City Life" text3="IdentitÃƒÆ’Ã‚Â© et Culture" text4="Culture" text5="Dossiers" text6="ÃƒÆ’Ã¢â‚¬Â°conomie" text7="Faits divers" text8="Reportages" />
                <FooterLinks text="Non classÃƒÆ’Ã‚Â©" text1="Opinions" text2="Partenaires" text3="Politique" text4="Portrait" text5="Radio" text6="Recommandations" text7="Le choix de la rÃƒÆ’Ã‚Â©daction" text8="RÃƒÆ’Ã‚Â©gions" />
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[90px]" data-name="Links 03">
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    International
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Tribune libre
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Life
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    MÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â©o
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Monde
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Social
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Solution
                  </p>
                  <p className="relative shrink-0 w-full" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                    Sport
                  </p>
                </div>
              </div>
            </div>
            <div className="content-stretch flex flex-col gap-[15px] items-start relative shrink-0 w-[265px]">
              <div className={`flex flex-col font-["Roboto_Flex:SemiBold",sans-serif] font-semibold justify-center leading-[0] min-w-full not-italic relative shrink-0 text-[12px] w-[min-content] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                <p className="leading-[normal] whitespace-pre-wrap">Tag</p>
              </div>
              <div className="content-start flex flex-wrap gap-[3px] h-[102px] items-start relative shrink-0 w-full" data-name="Tag">
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold h-[10px] justify-center leading-[0] not-italic relative shrink-0 text-[8px] w-[32px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px] whitespace-pre-wrap">{`Ãƒâ€šÃ‚Â Politics`}</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px]">Business</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[76px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px]">Nature</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px]">International</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px]">Europe</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[65px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold h-[12px] justify-center leading-[0] not-italic relative shrink-0 text-[8px] w-[24px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px] whitespace-pre-wrap">Africa</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">Madagascar</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[57px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold h-[9px] justify-center leading-[0] not-italic relative shrink-0 text-[8px] w-[31px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px] whitespace-pre-wrap">Cinema</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[57px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold h-[11px] justify-center leading-[0] not-italic relative shrink-0 text-[8px] w-[35px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[24px] whitespace-pre-wrap">Musique</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">Interviews</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">Europe</p>
                    </div>
                  </FooterHelper>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[75px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">SantÃƒÆ’Ã‚Â©</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[71px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">Medecine</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[57px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">Justice</p>
                    </div>
                  </FooterHelper1>
                </div>
                <div className="h-[18px] relative rounded-[20px] shrink-0 w-[57px]">
                  <div aria-hidden="true" className={`absolute border border-solid inset-0 pointer-events-none rounded-[20px] ${isLight ? "border-[#0a0a0a]" : "border-white"}`} />
                  <FooterHelper1>
                    <div className={`flex flex-col font-["Roboto_Flex:Bold",sans-serif] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[8px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[8px]">CarriÃƒÆ’Ã‚Â¨re</p>
                    </div>
                  </FooterHelper1>
                </div>
              </div>
              <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
                <div className={`col-1 flex flex-col font-["Roboto_Flex:SemiBold",sans-serif] font-semibold justify-center ml-0 mt-0 not-italic relative row-1 text-[12px] whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[normal]">Social Media</p>
                </div>
                <div className={`col-1 flex flex-col font-["Roboto_Flex:Regular",sans-serif] font-normal h-[13px] justify-center ml-[0.36px] mt-[25px] not-italic relative row-1 text-[10px] w-[94.62px] ${isLight ? "text-[#0a0a0a]" : "text-white"}`} style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                  <p className="leading-[normal] whitespace-pre-wrap">Group Subscriptions</p>
                </div>
                <div className="col-1 content-stretch flex gap-[6px] items-start ml-[1.36px] mt-[47px] relative row-1" data-name="Icones">
                  <div className="relative shrink-0 size-[15px]" data-name="youtube">
                    <div className="absolute inset-[16.67%_4.17%]" data-name="icon">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 13.7499 10" : "0 0 21.9998 16"}>
                        <g id="icon">
                          <path d={isLight ? svgPaths.p2c7aa300 : svgPaths.p2f1f8a00} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector" />
                          <path d={isLight ? svgPaths.p3663ec00 : svgPaths.pa9f7700} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector_2" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[15px]" data-name="x">
                    <div className="absolute inset-[14.58%_13.33%]" data-name="icon">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 10.9999 10.6251" : "0 0 17.5999 17.0002"}>
                        <g id="icon">
                          <path d={isLight ? svgPaths.p9009980 : svgPaths.p1b402e00} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector" />
                          <path d={isLight ? svgPaths.p73e5200 : svgPaths.p20c7f3f0} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector_2" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[15px]" data-name="instagram">
                    <div className="absolute inset-[12.5%]" data-name="icon">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 11.25 11.25" : "0 0 18 18"}>
                        <g id="icon">
                          <path d={isLight ? svgPaths.p368e3580 : svgPaths.p1b45cc80} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector" />
                          <path d={isLight ? svgPaths.p2d39fa00 : svgPaths.p2eb90c00} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector_2" />
                          <path d={isLight ? svgPaths.pef92af0 : svgPaths.p2a568ac0} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector_3" />
                        </g>
                      </svg>
                    </div>
                  </div>
                  <div className="relative shrink-0 size-[15px]" data-name="facebook">
                    <div className="absolute inset-[12.5%]" data-name="icon">
                      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox={isLight ? "0 0 11.25 11.25" : "0 0 18 18"}>
                        <g id="icon">
                          <path d={isLight ? svgPaths.p1beb440 : svgPaths.p125c6800} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector" />
                          <path d={isLight ? svgPaths.p368e3580 : svgPaths.p1b45cc80} fill={isLight ? "var(--fill-0, #0A0A0A)" : "var(--fill-0, #212121)"} id="Vector_2" />
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-[1_0_0] items-center justify-between min-h-px min-w-px relative w-full" data-name="Nav Footer">
            <div aria-hidden="true" className={`absolute border-solid inset-0 pointer-events-none ${isLight ? "border-[#f2f2f2] border-t" : "border-0 border-[#404040]"}`} />
            <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="List ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Item">
              <div className={`flex flex-col font-["Inter:Regular",sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[9.6px] text-center whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`}>
                <p className="leading-[11px]">Ãƒâ€šÃ‚Â©Ãƒâ€šÃ‚Â 2026Ãƒâ€šÃ‚Â 24/24 MG</p>
              </div>
            </div>
            <div className={`content-stretch flex font-["Inter:Regular",sans-serif] font-normal gap-[20px] items-start justify-center leading-[0] not-italic px-[10px] py-[0.5px] relative shrink-0 text-center whitespace-nowrap ${isLight ? "text-[#0a0a0a]" : "text-white"}`} data-name="List">
              <div className="flex flex-col justify-center relative shrink-0 text-[9.3px]">
                <p className="leading-[20px]">Lorem</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                <p className="leading-[20px]">Privacy Policy</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                <p className="leading-[20px]">Cookie Policy</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                <p className="leading-[20px]">Terms of Service</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.6px]">
                <p className="leading-[20px]">Terms of Sale</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.8px]">
                <p className="leading-[20px]">Help</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[9.8px]">
                <p className="leading-[20px]">Subscriptions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ads({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#27624f] h-[121.333px] relative rounded-[12px] w-[445px]"} data-name="Ads">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center p-[14px] relative size-full">
          <div className="relative shrink-0">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[5.598px] items-center justify-center relative">
              <div className="h-[19.273px] relative shrink-0 w-[18.504px]" data-name="Union">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.5039 19.2734">
                  <path d={svgPaths.p8e430} fill="var(--fill-0, white)" id="Union" />
                </svg>
              </div>
              <Text4 text="Votre Pub ICI" additionalClassNames="text-[14.55px] text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Interaction({ className }: { className?: string }) {
  return (
    <div className={className || "relative"} data-name="Interaction">
      <div className="content-stretch flex gap-[5px] items-start relative">
        <InteractionHelper>
          <g id="Base" />
          <path d={svgPaths.p31025d00} id="Vector" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
        </InteractionHelper>
        <InteractionHelper>
          <g id="Base" />
          <path d={svgPaths.pb98340} id="Vector" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          <path d={svgPaths.p25523a00} id="Vector 137" stroke="var(--stroke-0, #292929)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
        </InteractionHelper>
      </div>
    </div>
  );
}

function Headline2({ className }: { className?: string }) {
  return (
    <div className={className || "relative w-[337px]"} data-name="Headline 2">
      <div className="content-stretch flex flex-col gap-[14px] items-start relative w-full">
        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
          <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name="Profile">
            <LogoImage />
            <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" />
          </div>
          <Text7 text="Andrianina Rajoelisoa, dit Joely, publie ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œIfalio ny marainaÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, son premier recueil de poÃƒÆ’Ã‚Â¨mes chez Hakanto Editions" />
        </div>
        <Interaction className="relative shrink-0" />
      </div>
    </div>
  );
}
type TypeProps = {
  className?: string;
  property1?: "ÃƒÆ’Ã¢â€šÂ¬ la une" | "Actu" | "Video" | "Live";
};

function Type({ className, property1 = "ÃƒÆ’Ã¢â€šÂ¬ la une" }: TypeProps) {
  return (
    <div className={className || "bg-[#27624f] h-[17px] relative rounded-[999px]"}>
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex h-full items-center justify-center px-[10px] py-[4px] relative">
          <div className="flex flex-col font-['Roboto_Flex:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[8px] text-white uppercase whitespace-nowrap" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
            <p className="leading-[normal]">{property1 === "Live" ? "Live" : property1 === "Video" ? "Video" : property1 === "Actu" ? "ActualitÃƒÆ’Ã‚Â©" : "ÃƒÆ’Ã¢â€šÂ¬ la une"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Headline1({ className }: { className?: string }) {
  return (
    <div className={className || "relative w-[280px]"} data-name="Headline 1">
      <Helper />
    </div>
  );
}

function Ads1({ className }: { className?: string }) {
  return (
    <div className={className || "bg-[#27624f] relative rounded-[12px] w-[787.978px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"} data-name="Ads 02">
      <div className="content-stretch flex flex-col items-start overflow-clip px-[283px] py-[81px] relative rounded-[inherit] w-full">
        <Helper1 additionalClassNames="shrink-0 w-full" />
      </div>
    </div>
  );
}
type HeaderFreeUserProps = {
  className?: string;
  property1?: "Dark" | "light";
};

function HeaderFreeUser({ className, property1 = "Dark" }: HeaderFreeUserProps) {
  const isLight = property1 === "light";
  return (
    <div className={className || "min-w-[1220px] relative w-[1440px]"}>
      <div className="flex flex-row items-center min-w-[inherit] size-full">

      </div>
    </div>
  );
}

export default function Actu() {
  const navigate = useNavigate();

  // Make navigate available globally for nested components
  if (typeof window !== 'undefined') {
    (window as any).__navigate__ = navigate;
  }

  return (
    <div className="bg-white relative size-full flex justify-center" data-name="ACTU">
      <div className="content-stretch flex flex-col gap-[24px] items-center px-[32px] w-[1440px]" data-name="Main">

        <HeaderFreeUser className="min-w-[1220px] relative shrink-0 w-[1440px]" property1="light" />
        <div className="bg-[#fafafa] relative shrink-0 w-[1440px]" data-name="Nav Filtre Categorie">
          <div className="flex flex-row items-center size-full">
            <div className="content-stretch flex items-center justify-center px-[112px] py-[24px] relative w-full">
              <div className="content-stretch flex items-center justify-between relative shrink-0 w-[644px]" data-name="Blog categorie">
                <NavFiltreCategorieChevronLeft additionalClassNames="shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                  <path d="M5 9L1 5L5 1" id="Icon" stroke="var(--stroke-0, #D4D4D4)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </NavFiltreCategorieChevronLeft>
                <div className="content-stretch flex gap-[24px] items-center overflow-clip relative shrink-0 w-[581px]" data-name="Categories">
                  <div className="content-stretch flex items-center relative shrink-0 cursor-pointer group" data-name="Dashboard Link">
                    <p className="font-['Roboto_Flex:Bold',sans-serif] font-bold leading-[normal] not-italic relative shrink-0 text-[12px] text-black pb-1 transition-colors duration-300 ease-in-out group-hover:text-[#27624f]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      Tout
                    </p>
                    <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#27624f] transition-all duration-300 ease-in-out group-hover:w-full"></span>
                  </div>
                  <NavFiltreCategorieText text="Politques" />
                  <NavFiltreCategorieText text="Faits divers" />
                  <NavFiltreCategorieText text="MÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â©o" />
                  <NavFiltreCategorieText text="ÃƒÆ’Ã¢â‚¬Â°conomie" />
                  <NavFiltreCategorieText text="Social" />
                  <NavFiltreCategorieText text="RÃƒÆ’Ã‚Â©gions" additionalClassNames="justify-center" />
                  <NavFiltreCategorieText text="Monde" additionalClassNames="justify-center" />
                  <NavFiltreCategorieText text="Culture" additionalClassNames="justify-center" />
                  <NavFiltreCategorieText text="Sport" additionalClassNames="justify-center" />
                  <NavFiltreCategorieText text="Lifestyle" additionalClassNames="justify-center" />
                </div>
                <div className="flex items-center justify-center relative shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                  <div className="-scale-y-100 flex-none rotate-180">
                    <NavFiltreCategorieChevronLeft>
                      <path d="M5 9L1 5L5 1" id="Icon" stroke="var(--stroke-0, black)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </NavFiltreCategorieChevronLeft>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[19px] items-start relative shrink-0" data-name="Contents">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[793px]" data-name="Contents Left">
            <Text8 text="Breaking" />
            <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Container">
              <div className="content-stretch flex flex-col gap-[14px] items-start justify-center relative shrink-0 w-full" data-name="Contents">
                <NavActuContentText text="Politics" />
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[793px]" data-name="Parent news contents">
                  <HorizontalDivider1 />
                  <div className="content-start flex flex-wrap gap-[8px_20px] items-start relative shrink-0 w-full" data-name="Contents">
                    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0" data-name="Left content">
                      <div className="relative shrink-0 w-[280px]" data-name="Headline 3">
                        <Helper />
                      </div>
                      <HorizontalDivider />
                      <Headline additionalClassNames="w-[280px]">
                        <Type className="bg-[#27624f] h-[17px] relative rounded-[999px] shrink-0" />
                        <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Bolg texte">
                          <Profile />
                          <p className="font-['Georgia:Bold',sans-serif] leading-none min-w-full not-italic relative shrink-0 text-[#121212] text-[18px] w-[min-content] whitespace-pre-wrap">Mahmoud Ali Youssouf reÃƒÆ’Ã‚Â§oit Christine Razanamahasoa en marge du Sommet de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine ÃƒÆ’Ã‚Â  Addis-Abeba</p>
                          <p className="font-['Roboto_Flex:Regular',sans-serif] font-normal leading-[14px] min-w-full not-italic overflow-hidden relative shrink-0 text-[#5a5a5a] text-ellipsis w-[min-content] whitespace-pre-wrap line-clamp-2 text-[12px]" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                            Une dÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â©gation malgache a bien ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© prÃƒÆ’Ã‚Â©sente ÃƒÆ’Ã‚Â  Addis Abeba ce weekend. Bien que Madagascar nÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ait pas participÃƒÆ’Ã‚Â© aux travaux du 39ÃƒÆ’Ã‚Â¨me Sommet des chefs dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Etat et de gouvernement de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine, la ministre des Affaires ÃƒÆ’Ã‚Â©trangÃƒÆ’Ã‚Â¨res, Christine Razanamahasoa, a pu avoir quelques rencontres officielles sur place. Elle a, entre autres, ÃƒÆ’Ã‚Â©tÃƒÆ’Ã‚Â© reÃƒÆ’Ã‚Â§ue par Mahmoud Ali Youssouf, prÃƒÆ’Ã‚Â©sident de la Commission de lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Union africaine en marge du Sommet, ce lundi. Dimanche, elle a pu avoir une audience avec son homologue djiboutien, Abdoulkader Houssein Omar.
                          </p>
                          <button
                            onClick={() => {
                              const navigate = (window as any).__navigate__;
                              if (navigate) navigate('/article/1');
                            }}
                            className="text-[#27624f] text-[12px] font-['Roboto_Flex:Regular',sans-serif] font-normal relative inline-block after:content-[''] after:absolute after:w-0 after:h-[1px] after:bg-[#27624f] after:left-0 after:bottom-0 after:transition-all after:duration-300 hover:after:w-full transition-all cursor-pointer"
                            style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}
                          >
                            Lire la suite ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢
                          </button>
                        </div>
                        <Interaction className="relative shrink-0" />
                      </Headline>
                    </div>
                    <VerticalDivider />
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-end min-h-px min-w-px relative" data-name="Left section">
                      <Wrapper
                        additionalClassNames="h-[423px] w-full"
                        onClick={() => {
                          const navigate = (window as any).__navigate__;
                          if (navigate) navigate('/article/1');
                        }}
                      >
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu1} />
                      </Wrapper>
                      <Wrapper1>
                      </Wrapper1>
                    </div>
                  </div>
                </div>
              </div>
              <Ads1 className="bg-[#27624f] relative rounded-[12px] shrink-0 w-[794px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1" />
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-name="Contents">
                <div className="bg-white h-[30px] leading-[0] not-italic overflow-auto relative shrink-0 text-[#121212] w-[793px]" data-name="Nav actu content">
                  <Text9 text="Social" />
                  <div className="-translate-y-1/2 absolute content-stretch flex font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[24px] items-center left-[159.72px] top-1/2 whitespace-nowrap" data-name="List">
                    <Text6 text="Cyclone" />
                    <Text6 text="Reconstructions" />
                    <ListText text="Sinistre National" />
                    <ListText text="Intemperies" />
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[793px]" data-name="Parent news contents">
                  <HorizontalDivider1 />
                  <div className="content-start flex flex-wrap gap-[8px_20px] items-start relative shrink-0 w-full" data-name="Contents">
                    <LeftContent />
                    <VerticalDivider />
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-end min-h-px min-w-px relative" data-name="Left section">
                      <Wrapper
                        additionalClassNames="h-[423px] w-full"
                        onClick={() => {
                          const navigate = (window as any).__navigate__;
                          if (navigate) navigate('/article/1');
                        }}
                      >
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu1} />
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu2} />
                      </Wrapper>
                      <Wrapper1>
                      </Wrapper1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[329px]" data-name="Contents Right">
            <ComplimentInfoCards additionalClassNames="w-full">
              <Text2 text="LittÃƒÆ’Ã‚Â©rature" additionalClassNames="not-italic text-[#121212]" />
              <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Figure">
                <Wrapper
                  additionalClassNames="h-[198px] w-full"
                  onClick={() => {
                    const navigate = (window as any).__navigate__;
                    if (navigate) navigate('/article/1');
                  }}
                >
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                  <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment2} />
                </Wrapper>
                <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] text-right w-full">
                </div>
              </div>
              <Headline additionalClassNames="w-full">
                <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Blog texte">
                  <div className="content-stretch flex gap-[10px] items-start relative shrink-0" data-name="Profile">
                    <LogoImage />
                    <Text3 text="17 FÃƒÆ’Ã‚Â©vrier 2026" />
                  </div>
                  <Text7 text="Andrianina Rajoelisoa, dit Joely, publie ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œIfalio ny marainaÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, son premier recueil de poÃƒÆ’Ã‚Â¨mes chez Hakanto Editions" />
                </div>
                <Interaction className="relative shrink-0" />
              </Headline>
            </ComplimentInfoCards>
            <HorizontalDivider />
            <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
              <ComplimentInfoCards additionalClassNames="w-[151.45px]">
                <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Image content">
                  <Text5 text="Faits divers" />
                  <Wrapper additionalClassNames="size-[151.45px]">
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                    <div className="absolute inset-0 overflow-hidden rounded-[12px]">
                      <img alt="" className="absolute h-[108.29%] left-[-25.61%] max-w-none top-0 w-[151.21%]" src={imgImageActuCompliment3} />
                    </div>
                  </Wrapper>
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] w-full">
                  </div>
                </div>
                <ContentsText text="ColisÃƒÆ’Ã‚Â©e ÃƒÆ’Ã‚Â  retirer dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Anatirova, selon le ministre de la Communication et de la Culture" />
              </ComplimentInfoCards>
              <ComplimentInfoCards additionalClassNames="w-[151.45px]">
                <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Image content">
                  <Text5 text="Culture" />
                  <Wrapper additionalClassNames="size-[151.45px]">
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment4} />
                  </Wrapper>
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] w-full">
                  </div>
                </div>
                <ContentsText text="Rijasolo remporte le prix AndrÃƒÆ’Ã‚Â©e Moser 2026 avec sa sÃƒÆ’Ã‚Â©rie ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œMadagascar,Ãƒâ€šÃ‚Â Terre des espritsÃƒâ€šÃ‚Â Ãƒâ€šÃ‚Â»" />
              </ComplimentInfoCards>
            </div>
            <Ads className="bg-[#27624f] h-[173px] relative rounded-[12px] shrink-0 w-[328px]" />
            <div className="content-stretch flex flex-col gap-[19px] items-start relative shrink-0 w-full" data-name="BrÃƒÆ’Ã‚Â¨ves fils info madagascar">
              <Text8 text="BrÃƒÆ’Ã‚Â¨ves fils info madagascar" />
              <div className="content-stretch flex gap-[19px] items-center relative shrink-0 w-full" data-name="Content">
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[18px] items-start min-h-px min-w-px not-italic relative" data-name="Contents">
                  <div className="content-stretch flex flex-col gap-[5px] items-start relative shrink-0 text-[12px] w-full" data-name="Link">
                    <div className="flex flex-col font-['Georgia:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-black w-full">
                      <p className="leading-[normal] whitespace-pre-wrap">CATASTROPHE</p>
                    </div>
                    <Text1 text="Cinq nouveaux dÃƒÆ’Ã‚Â©cÃƒÆ’Ã‚Â¨s ajoutÃƒÆ’Ã‚Â©s au bilan du BNGRC aprÃƒÆ’Ã‚Â¨s le passage du cyclone Gezani" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[5px] items-start relative shrink-0 w-full" data-name="Link">
                    <div className="flex flex-col font-['Georgia:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[0px] text-black w-full">
                      <p className="leading-[normal] text-[12px] whitespace-pre-wrap">INTEMPERIES</p>
                    </div>
                    <Text text="Le bilan humain de Gezani sÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ve ÃƒÆ’Ã‚Â  20 morts" additionalClassNames="leading-[normal] text-[#525252] whitespace-pre-wrap" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[5px] items-start relative shrink-0 text-[12px] w-full" data-name="Link">
                    <div className="flex flex-col font-['Georgia:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-black w-full">
                      <p className="leading-[normal] whitespace-pre-wrap">AIDES HUMANITAIRES</p>
                    </div>
                    <Text1 text="Des experts suisses en mission dÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aide humanitaire ÃƒÆ’Ã‚Â  Toamasina aprÃƒÆ’Ã‚Â¨s le cyclone Gezani" />
                  </div>
                  <div className="content-stretch flex flex-col gap-[5px] items-start relative shrink-0 w-full" data-name="Link">
                    <div className="flex flex-col font-['Georgia:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[0px] text-black w-full">
                      <p className="leading-[normal] text-[12px] whitespace-pre-wrap">CYCLONE</p>
                    </div>
                    <Text text="PrÃƒÆ’Ã‚Â¨s de 30 centres de santÃƒÆ’Ã‚Â© de base endommagÃƒÆ’Ã‚Â©s et dÃƒÆ’Ã‚Â©truits dans lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢Atsinanana" additionalClassNames="leading-[normal] text-[#525252] whitespace-pre-wrap" />
                  </div>
                </div>
                <div className="h-[106.469px] relative shrink-0 w-[2px]" data-name="Pagination">
                  <div className="absolute flex inset-[0_0_77.46%_0] items-center justify-center">
                    <div className="flex-none h-[2px] rotate-90 w-[24px]">
                      <div className="bg-[#d9d9d9] size-full" />
                    </div>
                  </div>
                  <div className="absolute flex inset-[25.82%_0_51.64%_0] items-center justify-center">
                    <div className="flex-none h-[2px] rotate-90 w-[24px]">
                      <div className="bg-[#737373] size-full" />
                    </div>
                  </div>
                  <div className="absolute flex inset-[51.64%_0_25.82%_0] items-center justify-center">
                    <div className="flex-none h-[2px] rotate-90 w-[24px]">
                      <div className="bg-[#525252] size-full" />
                    </div>
                  </div>
                  <div className="absolute flex inset-[77.46%_0_0_0] items-center justify-center">
                    <div className="flex-none h-[2px] rotate-90 w-[24px]">
                      <div className="bg-[#404040] size-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#dfdfdf] h-[340px] relative shrink-0 w-[1440px]" data-name="Ads 03">
          <div className="flex flex-col items-center size-full">
            <div className="content-stretch flex flex-col items-center relative size-full">
              <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[31px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[9.1px] text-center tracking-[0.5px] uppercase w-full">
                <p className="leading-[10px] whitespace-pre-wrap">PublicitÃƒÆ’Ã‚Â©</p>
              </div>
              <div className="bg-[#dfdfdf] relative shrink-0 w-full" data-name="Ads 5">
                <div aria-hidden="true" className="absolute border-[#dfdfdf] border-b border-solid border-t inset-0 pointer-events-none" />
                <div className="content-stretch flex gap-[14px] items-start px-[14px] py-px relative w-full">
                  <Ads03Ads>
                    <img alt="" className="absolute h-full left-[-2.69%] max-w-none top-0 w-[116.16%]" src={imgAds3} />
                  </Ads03Ads>
                  <Ads03Ads>
                    <img alt="" className="absolute h-[163.02%] left-0 max-w-none top-[0.17%] w-full" src={imgAds02} />
                  </Ads03Ads>
                  <Ads03Ads>
                    <img alt="" className="absolute h-[136.66%] left-[-0.02%] max-w-none top-[-0.09%] w-full" src={imgAds4} />
                  </Ads03Ads>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="content-stretch flex gap-[19px] items-start relative shrink-0 w-[1140px]" data-name="Contents">
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[793px]" data-name="Contents Left">
            <Text8 text="Breaking" />
            <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
              <div className="content-stretch flex flex-col gap-[14px] items-start justify-center relative shrink-0 w-full" data-name="Contents">
                <NavActuContentText text="Sport" />
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[793px]" data-name="Parent news contents">
                  <HorizontalDivider1 />
                  <div className="content-start flex flex-wrap gap-[8px_20px] items-start relative shrink-0 w-full" data-name="Contents">
                    <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0" data-name="Left content">
                      <Headline1 className="relative shrink-0 w-[280px]" />
                      <HorizontalDivider />
                      <Headline1 className="relative shrink-0 w-[280px]" />
                    </div>
                    <VerticalDivider />
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-end min-h-px min-w-px relative" data-name="Left section">
                      <Wrapper
                        additionalClassNames="h-[423px] w-full"
                        onClick={() => {
                          const navigate = (window as any).__navigate__;
                          if (navigate) navigate('/article/1');
                        }}
                      >
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu1} />
                        <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu3} />
                      </Wrapper>
                      <Wrapper1>
                      </Wrapper1>
                    </div>
                  </div>
                </div>
              </div>
              <Ads1 className="bg-[#27624f] relative rounded-[12px] shrink-0 w-[794px] cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1" />
              <div className="content-stretch flex flex-col gap-[14px] items-start relative shrink-0 w-full" data-name="Contents">
                <div className="bg-white h-[30px] leading-[0] not-italic overflow-auto relative shrink-0 text-[#121212] w-[793px]" data-name="Nav actu content">
                  <Text9 text="Type of news" />
                  <div className="-translate-y-1/2 absolute content-stretch flex font-['Roboto_Flex:Regular',sans-serif] font-normal gap-[24px] items-center left-[159.72px] text-[10px] top-1/2 whitespace-nowrap" data-name="List">
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 01</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 02</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 03</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 04</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 04</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 04</p>
                    </div>
                    <div className="flex flex-col justify-center relative shrink-0" style={{ fontVariationSettings: "'GRAD' 0, 'wdth' 100, 'XOPQ' 96, 'YOPQ' 79, 'XTRA' 468, 'YTUC' 712, 'YTLC' 514, 'YTAS' 750, 'YTDE' -203, 'YTFI' 738" }}>
                      <p className="leading-[normal]">About News 04</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-[793px]" data-name="Parent news contents">
                  <HorizontalDivider1 />
                  <div className="content-start flex flex-wrap gap-[8px_20px] items-start relative shrink-0 w-full" data-name="Contents">
                    <LeftContent />
                    <VerticalDivider />
                    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[10px] items-end min-h-px min-w-px relative" data-name="Left section">
                      <div className="h-[423px] overflow-clip relative rounded-[12px] shrink-0 w-full" data-name="Image actu">
                        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                          <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                          <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu1} />
                          <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu4} />
                        </div>
                        <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(18,18,18,0.6)] content-stretch flex items-center justify-center left-[calc(50%+0.5px)] p-px rounded-[32px] top-[calc(50%-0.45px)]" data-name="Button - Play">
                          <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.16)] border-solid inset-0 pointer-events-none rounded-[32px]" />
                          <div className="content-stretch flex items-start p-[16px] relative shrink-0" data-name="Container">
                            <div className="relative shrink-0 size-[30px]" data-name="Mask Group">
                              <div className="absolute content-stretch flex flex-col h-[30px] items-start left-0 top-0" data-name="Mask">
                                <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 size-[30px]" data-name="image fill">
                                  <div className="relative shrink-0 size-[30px]" data-name="image">
                                    <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30 30">
                                      <g id="image">
                                        <path d={svgPaths.pe429372} fill="var(--fill-0, white)" id="Vector" />
                                      </g>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute bg-white left-0 size-[30px] top-0" data-name="Background" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <Wrapper1>
                      </Wrapper1>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[329px]" data-name="Contents Right">
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Article Populaire">
              <Text4 text="Article populaire" additionalClassNames="text-[#27624f] text-[16px]" />
              <ComplimentInfoCards additionalClassNames="w-full">
                <Text2 text="LittÃƒÆ’Ã‚Â©rature" additionalClassNames="not-italic text-[#121212]" />
                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Figure">
                  <Wrapper
                    additionalClassNames="h-[198px] w-full"
                    onClick={() => {
                      const navigate = (window as any).__navigate__;
                      if (navigate) navigate('/article/1');
                    }}
                  >
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment2} />
                    <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActuCompliment5} />
                  </Wrapper>
                  <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] text-right w-full">
                  </div>
                </div>
                <Headline2 className="relative shrink-0 w-full" />
              </ComplimentInfoCards>
            </div>
            <div className="content-stretch flex flex-col gap-[20px] items-start relative shrink-0 w-full" data-name="Reportage">
              <Text4 text="Reportages" additionalClassNames="text-[#27624f] text-[16px]" />
              <div className="relative shrink-0 w-full" data-name="Video card">
                <div className="flex flex-col justify-center size-full">
                  <div className="content-stretch flex flex-col gap-[20px] items-start justify-center relative w-full">
                    <Text2 text="Fais divers" additionalClassNames="not-italic text-[#121212]" />
                    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-full" data-name="Image content">
                      <div className="h-[239px] overflow-clip relative rounded-[12px] shrink-0 w-full" data-name="Video card">
                        <div aria-hidden="true" className="absolute inset-0 pointer-events-none rounded-[12px]">
                          <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgImageActu} />
                          <img alt="" className="absolute max-w-none object-cover rounded-[12px] size-full" src={imgVideoCard} />
                        </div>
                        <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[rgba(18,18,18,0.6)] border-[0.734px] border-[rgba(255,255,255,0.16)] border-solid left-[calc(50%+0.5px)] rounded-[23.5px] size-[47px] top-1/2" data-name="nyt-betamax ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Group - Deep Clean a Comforter Every Few Years video ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Slot ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ nyt-betamax-overlay-controls ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Button - Play">
                          <div className="absolute left-[11.75px] size-[22.031px] top-[11.75px]" data-name="Mask Group">
                            <div className="absolute left-0 size-[22.031px] top-0" data-name="Mask">
                              <div className="absolute left-0 overflow-clip size-[22.031px] top-0" data-name="image fill">
                                <div className="absolute left-0 size-[22.031px] top-0" data-name="image">
                                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 22.0312 22.0312">
                                    <g id="image">
                                      <path d={svgPaths.pc83c80} fill="var(--fill-0, white)" id="Vector" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="absolute bg-white left-0 size-[22.031px] top-0" data-name="Background" />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[10.75px] justify-center leading-[0] not-italic relative shrink-0 text-[#727272] text-[8px] w-full">
                        <p className="leading-[10.75px] whitespace-pre-wrap">Video source</p>
                      </div>
                    </div>
                    <Headline2 className="relative shrink-0 w-full" />
                  </div>
                </div>
              </div>
            </div>
            <HorizontalDivider />
            <Ads className="bg-[#27624f] h-[173px] relative rounded-[12px] shrink-0 w-[328px]" />
          </div>
        </div>
        <Footer className="bg-white h-[493px] relative shrink-0 w-[1440px]" property1="Light" />
      </div>
    </div>
  );
}

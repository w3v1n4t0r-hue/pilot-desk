import {banks as generatedBanks,trackMeta as generatedTrackMeta,publicSources as generatedPublicSources,bankManifest as generatedManifest} from './question-bank.js';

export type Track='ppl'|'ira'|'cpl'|'cfi'|'cfii'|'atp';
export type Difficulty='foundation'|'applied'|'advanced';
export type StandardType='ACS'|'PTS';
export type PrepQuestion={
  id:string;
  area:string;
  prompt:string;
  options:string[];
  correct:number;
  explanation:string;
  reference:string;
  source:'faa-sample-derived'|'faa-sample-exact'|'pilotdesk-faa-parallel'|'pilotdesk-curated'|'pilotdesk-faa-aligned';
  sourceUrl?:string;
  figureRef?:{supplement:string;figure:string;url:string};
  choiceExplanations?:string[];
  reviewedAt?:string;
  authoring?:'curated-manual'|'generated';
  calibratedFrom?:string;
  standardCode:string;
  standardDoc:string;
  standardType:StandardType;
  difficulty:Difficulty;
  experienceLevel:Track;
};
export type TrackMeta={label:string;testCode:string;officialQuestions:number;officialMinutes:number;passingScore:number;description:string};
export type BankManifest={acsQuestionCount:number;supplementalPtsQuestionCount:number;totalQuestionCount:number;byTrack:Record<string,number>;standards:Record<string,{doc:string;type:string;url:string}>;generatedAt:string;legacyGeneratedFamiliesExcluded?:boolean};

export const banks=generatedBanks as Record<Track,PrepQuestion[]>;
export const trackMeta=generatedTrackMeta as Record<Track,TrackMeta>;
export const publicSources=generatedPublicSources as {label:string;url:string}[];
export const bankManifest=generatedManifest as BankManifest;

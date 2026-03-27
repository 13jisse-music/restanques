export interface StorySeq { id:string; moment:string; texts:string[]; image?:string }
export const STORY: StorySeq[] = [
  { id:'story_intro', moment:'Introduction', texts:['La Provence est en danger.','Le Mistral se reveille dans les Restanques.','Jisse et Melanie partent sauver leur terre.'], image:'/story/intro1.png' },
  { id:'story_garrigue_entree', moment:'Entree Garrigue', texts:['Collines de lavande. Marius accueille avec mefiance.'], image:'/story/story_restanques_intro.png' },
  { id:'story_garrigue_boss', moment:'Victoire Sanglier', texts:['Le Sanglier tombe. Le portail Calanques souvre.'], image:'/story/story_garrigue_end.png' },
  { id:'story_ending', moment:'Epilogue', texts:['Le vent se calme. La Provence respire.','Ils rentrent a la maison. Ensemble.'], image:'/story/ending1.png' },
]
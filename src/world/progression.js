// Permanent navigation state for one run. Respawn deliberately keeps this instance.
export class Progression {
  constructor(){this.flags=new Set();}
  has(id){return this.flags.has(id);}
  set(id){this.flags.add(id);}
  isOpen(exit){return !exit.flag||this.has(exit.flag);}
  canOpen(exit){return !this.isOpen(exit)&&
    ((exit.kind==='key'&&this.has('cemeteryKey'))||(exit.kind==='shortcut'&&exit.unlock));}
  open(exit){if(!this.canOpen(exit))return false;this.set(exit.flag);return true;}
  hint(exit){
    if(exit.kind==='key')return this.has('cemeteryKey')?'E / LB — abrir com a chave':'Fechadura do sol · falta a chave da Cripta';
    if(exit.kind==='lever')return 'Portão da corrente azul · procure o contrapeso acima';
    if(exit.kind==='shortcut')return exit.unlock?'E / LB — destravar atalho':'Tranca do outro lado · lembre deste lugar';
    return 'Pedra rachada · golpeie com a espada';
  }
}

// Trash Collection Schedule Data for Tijucas
// Source: Municipal waste collection schedule

import { TrashScheduleData } from '@/types/trash.types';

export const trashScheduleData: TrashScheduleData = {
    schemaVersion: "1.0.0",
    jurisdiction: {
        country: "BR",
        state: "SC",
        city: "Tijucas"
    },
    weekdaysEnum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"],
    serviceTypesEnum: ["COMMON", "SELECTIVE"],
    cadenceEnum: ["WEEKLY", "BIWEEKLY"],
    neighborhoods: [
        {
            id: "areias",
            name: "Areias",
            aliases: ["Areias"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["TUE", "THU", "SAT"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU,TH,SA",
                    human: "Terça, quinta e sábado"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=FR",
                    human: "Sexta"
                }
            }
        },
        {
            id: "campo-novo",
            name: "Campo Novo",
            aliases: ["Campo Novo", "CampoNovo"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "BIWEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU",
                    human: "Terça (quinzenal)"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "BIWEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TH",
                    human: "Quinta (quinzenal)"
                }
            }
        },
        {
            id: "centro",
            name: "Centro",
            aliases: ["Centro"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU",
                    human: "Terça"
                }
            }
        },
        {
            id: "imacol",
            name: "Imacol",
            aliases: ["Imacol"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["TUE", "THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU,TH",
                    human: "Terça e quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=FR",
                    human: "Sexta"
                }
            }
        },
        {
            id: "itinga",
            name: "Itinga",
            aliases: ["Itinga"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["SAT"],
                    rrule: "FREQ=WEEKLY;BYDAY=SA",
                    human: "Sábado"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["WED"],
                    rrule: "FREQ=WEEKLY;BYDAY=WE",
                    human: "Quarta"
                }
            }
        },
        {
            id: "joaia",
            name: "Joáia",
            aliases: ["Joáia", "Joaia"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                }
            }
        },
        {
            id: "morretes",
            name: "Morretes",
            aliases: ["Morretes"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=FR",
                    human: "Sexta"
                }
            }
        },
        {
            id: "nova-descoberta",
            name: "Nova Descoberta",
            aliases: ["Nova Descoberta", "NovaDescoberta"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["WED"],
                    rrule: "FREQ=WEEKLY;BYDAY=WE",
                    human: "Quarta"
                }
            }
        },
        {
            id: "oliveira",
            name: "Oliveira",
            aliases: ["Oliveira"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "BIWEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU",
                    human: "Terça (quinzenal)"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "BIWEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TH",
                    human: "Quinta (quinzenal)"
                }
            }
        },
        {
            id: "pernambuco",
            name: "Pernambuco",
            aliases: ["Pernambuco"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["WED"],
                    rrule: "FREQ=WEEKLY;BYDAY=WE",
                    human: "Quarta"
                }
            }
        },
        {
            id: "praca",
            name: "Praça",
            aliases: ["Praça", "Praca"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["TUE", "THU", "SAT"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU,TH,SA",
                    human: "Terça, quinta e sábado"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["MON"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO",
                    human: "Segunda"
                }
            }
        },
        {
            id: "santa-luzia",
            name: "Santa Luzia",
            aliases: ["Santa Luzia", "SantaLuzia"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["TUE", "THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU,TH",
                    human: "Terça e quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=FR",
                    human: "Sexta"
                }
            }
        },
        {
            id: "sul-do-rio",
            name: "Sul do Rio",
            aliases: ["Sul do Rio", "SulDoRio"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=FR",
                    human: "Sexta"
                }
            }
        },
        {
            id: "terra-nova",
            name: "Terra Nova",
            aliases: ["Terra Nova", "TerraNova"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "BIWEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TU",
                    human: "Terça (quinzenal)"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "BIWEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=TH",
                    human: "Quinta (quinzenal)"
                }
            }
        },
        {
            id: "timbe",
            name: "Timbé",
            aliases: ["Timbé", "Timbe"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["SAT"],
                    rrule: "FREQ=WEEKLY;BYDAY=SA",
                    human: "Sábado"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["WED"],
                    rrule: "FREQ=WEEKLY;BYDAY=WE",
                    human: "Quarta"
                }
            }
        },
        {
            id: "universitario",
            name: "Universitário",
            aliases: ["Universitário", "Universitario"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU",
                    human: "Terça"
                }
            }
        },
        {
            id: "xv-de-novembro",
            name: "XV de Novembro",
            aliases: ["XV de Novembro", "XVDeNovembro", "15 de Novembro", "15DeNovembro"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["THU"],
                    rrule: "FREQ=WEEKLY;BYDAY=TH",
                    human: "Quinta"
                }
            }
        },
        {
            id: "mata-atlantica-1-e-2",
            name: "Mata Atlântica 1 e 2",
            aliases: ["Mata Atlântica 1 e 2", "Mata Atlantica 1 e 2", "MataAtlantica 1 e 2", "Mata Atlântica"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU",
                    human: "Terça"
                }
            }
        },
        {
            id: "bosque-da-mata",
            name: "Bosque da Mata",
            aliases: ["Bosque da Mata", "BosqueDaMata"],
            collections: {
                common: {
                    serviceType: "COMMON",
                    cadence: "WEEKLY",
                    weekdays: ["MON", "WED", "FRI"],
                    rrule: "FREQ=WEEKLY;BYDAY=MO,WE,FR",
                    human: "Segunda, quarta e sexta"
                },
                selective: {
                    serviceType: "SELECTIVE",
                    cadence: "WEEKLY",
                    weekdays: ["TUE"],
                    rrule: "FREQ=WEEKLY;BYDAY=TU",
                    human: "Terça"
                }
            }
        }
    ]
};

export default trashScheduleData;

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const PAST_LIST = ` ANTONIO EMANUEL GUIMARAES NASSER	+55 (91) 98149-2962	Masculino	24/12/1960
 Elias da Silva chumbre 	+55 (91) 99914-9420	Masculino	19/08/2006
 Rivisson Eduardo Duarte dos Santos 	+55 (91) 98441-7831	Masculino	06/09/2001
Abraão Silva dos santos 	+55 (91) 98134-9942	Masculino	18/02/1994
Acácio Araújo 	+55 (91) 98289-4950	Masculino	23/06/1989
adauto reinaldo do nascimento júnior 	+55 (91) 98332-3943	Masculino	25/06/1996
ademlton Gadelha dos santos filhos 	+55 (91) 98187-2423	Masculino	21/06/1993
Adilson Maia Da Silva 	+55 (91) 98047-8965	Feminino	15/10/1983
Adrea Fernanda Freitas Cunha 	+55 (91) 98183-8190	Feminino	01/03/1995
Adrian David Barbosa de Almeida 	+55 (91) 98100-0160	Masculino	04/09/2001
Adriana Mariano de Aguiar	+55 (91) 98459-3825	Feminino	20/02/1982
Adriano Begot 	+55 (91) 99270-3047	Masculino	20/03/1993
Adriely Laurentino de Sousa 	+55 (91) 98353-1766	Feminino	03/12/1994
Ailton da Silva Reis	+55 (91) 99247-8263	Masculino	23/01/1981
Airton dos reis lima 	+55 (91) 98733-9411	Masculino	01/08/1990
Alan Alves De sousa	+55 (91) 99343-4275	Masculino	24/01/1996
Alan Carlos Farias da Silva	+55 (91) 99943-3620	Masculino	12/02/1989
Albedy Assef Bastos	+55 (91) 98488-8487	Masculino	09/04/1987
Alberto Cruz da Silva Junior	+55 (91) 91983-2283	Masculino	18/09/1986
Alda Tatiana Braga Santos	+55 (91) 98048-3392	Feminino	21/01/1996
Aldo apoliano aguiar 	+55 (91) 98530-6882	Masculino	10/03/1971
ALEFF LUAN 	+55 (91) 98624-7584	Masculino	23/10/2002
Alessandro Silva de Araújo 	+55 (91) 99613-3041	Masculino	08/02/1980
Alesson Silveira de Oliveira 	+55 (91) 98414-8421	Masculino	12/02/1998
ALEX ALBERTO BARROS DE ANDRADE	+55 (91) 98214-1728	Masculino	11/06/1990
ALEX BRENO COSTA MEDEIROS	+55 (91) 99279-5039	Masculino	25/09/1976
alex monteiro	+55 (91) 98990-3230	Masculino	10/05/1975
Alex Paixão Teixeira 	+55 (91) 98321-1663	Masculino	31/08/1981
Alex Pimentel Santos	+55 (91) 98601-7953	Masculino	31/12/1986
Alex Sandero Vicente machado	+55 (91) 98231-5774	Masculino	03/06/1997
Alexandre Odilon 	+55 (91) 98125-3673	Masculino	22/01/1995
Alexandre Vera cruz Tavares 	+55 (91) 98464-3549	Masculino	09/09/1997
Aline Martins Gomes	+55 (91) 99904-2887	Feminino	04/10/2008
ALISON SIMÕES DA SILVA	+55 (91) 98382-8008	Masculino	05/10/1981
Allan Castro	+55 (91) 98335-3666	Masculino	09/08/1989
Amadeu marciano guerreiro arruda 	+55 (91) 98035-6700	Masculino	11/01/1979`;

async function runImport() {
    const lines = PAST_LIST.split('\n');
    const company = "D3 Marketing"; // Placeholder for initial import

    const formatted = lines.map(line => {
        const parts = line.split('\t');
        return {
            nome: parts[0]?.trim(),
            telefone: parts[1]?.trim(),
            empresa: company,
            campos: {
                sexo: parts[2]?.trim(),
                data_nascimento: parts[3]?.trim(),
                origem: 'Importação Inicial'
            }
        };
    }).filter(l => l.nome && l.telefone);

    console.log(`Tentando importar ${formatted.length} contatos...`);

    const { data, error } = await supabase
        .from("contatos")
        .insert(formatted);

    if (error) {
        console.error("Erro na importação:", error);
    } else {
        console.log("Importação concluída com sucesso!");
    }
}

runImport();

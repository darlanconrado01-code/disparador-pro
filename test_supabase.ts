import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testando conexão com Supabase...");
    console.log("URL:", supabaseUrl);

    const { data, error } = await supabase
        .from("clientes")
        .select("nome_empresa");

    if (error) {
        console.error("Erro na conexão:", error.message);
    } else {
        console.log("Dados recebidos com sucesso:", data);
    }
}

test();

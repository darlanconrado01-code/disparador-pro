import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { createServer as createViteServer } from "vite";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());

  // Rota para salvar um disparo
  app.post("/api/disparos", async (req, res) => {
    try {
      const { nome_campanha, nome, numero, status, empresa } = req.body;
      const { data, error } = await supabase
        .from("disparos")
        .insert([{
          nome_campanha,
          nome,
          numero,
          status,
          empresa,
          data: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      res.json(data[0]);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Rota para buscar todos os relatórios
  app.get("/api/relatorios", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("disparos")
        .select("*")
        .order("data", { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Rota para buscar clientes (empresas)
  app.get("/api/clientes", async (req, res) => {
    console.log("Acessando /api/clientes");
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("nome_empresa")
        .order("nome_empresa", { ascending: true });

      if (error) {
        console.error("Erro Supabase:", error);
        throw error;
      }
      console.log("Clientes encontrados:", data);
      res.json(data);
    } catch (error) {
      console.error("Erro na rota /api/clientes:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();

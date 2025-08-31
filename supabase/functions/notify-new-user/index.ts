import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: 'INSERT';
  table: string;
  record: {
    id: string;
    user_id: string;
    nome_completo: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
  };
  old_record: null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Received request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload:', payload);

    // Check if this is a new employee with pending status
    if (payload.table === 'employees' && 
        payload.type === 'INSERT' && 
        payload.record.status === 'pendente') {
      
      const employee = payload.record;
      console.log('New pending employee:', employee.email);

      // Get admin users (proprietario and gerente with ativo status)
      const { data: admins, error: adminError } = await supabase
        .from('employees')
        .select('email, nome_completo, role')
        .in('role', ['proprietario', 'gerente'])
        .eq('status', 'ativo');

      if (adminError) {
        console.error('Error fetching admins:', adminError);
        throw adminError;
      }

      if (!admins || admins.length === 0) {
        console.log('No active admins found, skipping notification');
        return new Response(JSON.stringify({ message: 'No active admins found' }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Send email to all admins
      const adminEmails = admins.map(admin => admin.email);
      console.log('Sending notifications to:', adminEmails);

      const emailResponse = await resend.emails.send({
        from: "MyStore <onboarding@resend.dev>",
        to: adminEmails,
        subject: "Novo funcionário solicitou acesso - MyStore",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">MyStore</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestão</p>
            </div>

            <div style="background: #f8fafc; padding: 30px; border-radius: 12px; border-left: 4px solid #3b82f6;">
              <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Novo Acesso Solicitado</h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Um novo funcionário solicitou acesso ao sistema MyStore e está aguardando aprovação:
              </p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151; width: 30%;">Nome:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${employee.nome_completo}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Email:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${employee.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Cargo Solicitado:</td>
                    <td style="padding: 8px 0; color: #6b7280;">Vendedor</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #374151;">Data da Solicitação:</td>
                    <td style="padding: 8px 0; color: #6b7280;">${new Date(employee.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</td>
                  </tr>
                </table>
              </div>

              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⚠️ Ação necessária:</strong> Acesse o painel de administração para aprovar ou rejeitar esta solicitação.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${supabaseUrl.replace('.supabase.co', '')}" 
                   style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Acessar Painel de Administração
                </a>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 14px; margin: 0;">
                Este email foi enviado automaticamente pelo sistema MyStore.<br>
                Não responda a este email.
              </p>
            </div>
          </div>
        `,
      });

      console.log("Email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ 
        message: 'Notification sent successfully',
        emailId: emailResponse.data?.id 
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    // If not a pending employee insert, just return success
    return new Response(JSON.stringify({ message: 'No action needed' }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in notify-new-user function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString() 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
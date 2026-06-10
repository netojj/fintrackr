# tasks.py
import os
import time
from celery import Celery

# Configura o Celery com o broker Redis
# Para o ambiente local, o Redis é assumido na porta padrão.
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')

app = Celery('fintrackr_tasks', broker=REDIS_URL, backend=REDIS_URL)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='America/Sao_Paulo',
    enable_utc=True,
)

@app.task
def processar_relatorio_mensal(user_id, mes):
    """
    Simula uma tarefa de processamento em lote pesada (como compilar todas as
    estatísticas mensais, projeção de metas e geração de relatórios PDF/JSON).
    """
    print(f"[Celery] Iniciando geração de relatório para {user_id} - Mês {mes}")
    time.sleep(3) # Simulação de processamento assíncrono
    
    # Exemplo de payload processado
    resultado = {
        "user_id": user_id,
        "mes": mes,
        "status": "sucesso",
        "timestamp_conclusao": time.time()
    }
    print(f"[Celery] Relatório concluído para {user_id}")
    return resultado

@app.task
def recalcular_saldos_projetados(user_id):
    """
    Força um recálculo profundo e cache do saldo projetado em lote
    para os próximos 24 meses do usuário.
    """
    print(f"[Celery] Recalculando projeção futura em lote para {user_id}")
    time.sleep(2)
    return {"status": "recalculado"}

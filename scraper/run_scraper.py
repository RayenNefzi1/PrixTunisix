import os
import time
import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASS')
)
cursor = conn.cursor()

spider_map = {
    'Tunisianet': 'tunisianet',
    'TunisiaTech': 'tunisiteck', 
    'Zoom': 'zoom',
    'Khadraoui': 'khadraoui'
}

def run_spider(script_name, script_id):
    spider = spider_map.get(script_name, 'tunisianet')
    print(f'Running spider: {spider}')
    exit_code = os.system(f'cd prixtunisix && scrapy crawl {spider} --loglevel=INFO')
    if exit_code == 0:
        cursor.execute("UPDATE scraping_scripts SET active = false, last_run = %s WHERE id = %s", (datetime.now(), script_id))
    else:
        cursor.execute("UPDATE scraping_scripts SET active = false WHERE id = %s", (script_id,))
    conn.commit()
    print(f'Completed: {script_name}')

print('Scraper controller started.')
while True:
    try:
        now = datetime.now()
        
        # Check for manually queued jobs first
        cursor.execute("SELECT id, name FROM scraping_scripts WHERE active = true LIMIT 1")
        job = cursor.fetchone()
        
        if job:
            script_id, script_name = job
            print(f'Found queued job: {script_name}')
            run_spider(script_name, script_id)
            continue
        
        # Check for daily scheduled jobs (run at midnight)
        cursor.execute("SELECT id, name, last_run, frequency FROM scraping_scripts WHERE frequency = 'daily'")
        daily_scripts = cursor.fetchall()
        
        for script_id, script_name, last_run, frequency in daily_scripts:
            if last_run is None or (now - last_run).total_seconds() >= 86400:
                print(f'Daily schedule triggered for: {script_name}')
                cursor.execute("UPDATE scraping_scripts SET active = true WHERE id = %s", (script_id,))
                conn.commit()
                run_spider(script_name, script_id)
                break  # Process one at a time
        else:
            print('No jobs. Waiting 60s...')
            time.sleep(60)
            
    except Exception as e:
        print(f'Error: {e}')
        time.sleep(60)
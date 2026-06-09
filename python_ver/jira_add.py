import requests
import os
from dotenv import load_dotenv

load_dotenv()

JIRA_DOMAIN = os.getenv("JIRA_DOMAIN")
EMAIL = os.getenv("JIRA_EMAIL")
API_TOKEN = os.getenv("JIRA_API_TOKEN")
PROJECT_KEY = os.getenv("JIRA_PROJECT_KEY")

def create_jira_ticket(item_name, build_number, serial_number):
    url = f"https://{JIRA_DOMAIN}/rest/api/3/issue"
    
    auth = (EMAIL, API_TOKEN)
    
    payload = {
        "fields": {
            "project": { "key": PROJECT_KEY },
            "issuetype": { "name": "Task" },
            "summary": item_name,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": build_number,
                                "marks": [{ "type": "link", "attrs": { "href": build_number } }]
                            }
                        ]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": serial_number,
                                "marks": [{ "type": "link", "attrs": { "href": serial_number } }]
                            }
                        ]
                    }
                ]
            }
        }
    }
    
    response = requests.post(
        url,
        json=payload,
        auth=auth,
        headers={ "Accept": "application/json", "Content-Type": "application/json" }
    )
    
    if response.ok:
        print(f"✅ Success! Created card: {response.json()['key']}")
    else:
        print(f"❌ Error: {response.json()}")

if __name__ == "__main__":
    item_name = input("Build Name: ")
    build_number = input("Build Sheet link: ")
    serial_number = input("Serial Sheet link: ")
    
    create_jira_ticket(item_name, build_number, serial_number)
PROJECT_ID := 
PROJECT_NUMBER := 
ACCOUNT := 
ACCOUNT_ID :=
SERVICE_ACCOUNT :=
REGION :=

APP := viewer

init:
	gcloud services enable cloudbilling.googleapis.com --project=$(PROJECT_ID)
	gcloud beta billing projects link $(PROJECT_ID) --billing-account=$(ACCOUNT_ID)
	gcloud services enable cloudbuild.googleapis.com --project=$(PROJECT_ID)
	gcloud services enable run.googleapis.com --project=$(PROJECT_ID)

deploy:
	gcloud builds submit . --tag asia.gcr.io/$(PROJECT_ID)/$(APP) --project $(PROJECT_ID) 
	gcloud run deploy $(APP) \
		--project $(PROJECT_ID) \
		--image asia.gcr.io/$(PROJECT_ID)/$(APP) \
		--platform managed \
		--region $(REGION) \
		--memory 256Mi \
		--concurrency 1 \
		--max-instances 2 \
		--allow-unauthenticated 

all:

create_export:
	gcloud --project=$$PROJECT beta pubsub topics create $$TOPIC
	
	gcloud --project=$$PROJECT beta logging sinks create gcp_alert_service \
		pubsub.googleapis.com/projects/$$PROJECT/topics/$$TOPIC \
		--log-filter "logName=projects/$$PROJECT/logs/cloudaudit.googleapis.com%2Factivity"

	gcloud --project=$$PROJECT projects add-iam-policy-binding $$PROJECT \
		--member=$$(gcloud --project $$PROJECT --format="value(writer_identity)" beta logging sinks describe gcp_alert_service) \
		--role='roles/pubsub.publisher'

example:
	make create_export PROJECT=doit-playground TOPIC=test

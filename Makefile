create-export:
	# Create PubSub topic
	gcloud --project=$$PROJECT pubsub topics create gslack
	
	# Create logging export with PubSub sink
	gcloud --project=$$PROJECT logging sinks create gslack \
		pubsub.googleapis.com/projects/$$PROJECT/topics/gslack \
		--log-filter "logName=projects/$$PROJECT/logs/cloudaudit.googleapis.com%2Factivity"

	# Set permissions on the new topic
	gcloud --project=$$PROJECT projects add-iam-policy-binding $$PROJECT \
		--member=$$(gcloud --project $$PROJECT --format="value(writer_identity)" logging sinks describe gslack) \
		--role='roles/pubsub.publisher'

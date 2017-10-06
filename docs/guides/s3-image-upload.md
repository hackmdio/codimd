# Guide - Setup HackMD S3 image upload

1. Go to [AWS S3 console](https://console.aws.amazon.com/s3/home) and create a new bucket.

    ![create-bucket](images/s3-image-upload/create-bucket.png)

2. Click on bucket, select **Properties**  on the side panel, and find **Permission** section. Click **Edit bucket policy**.

    ![bucket-property](images/s3-image-upload/bucket-property.png)

3. Enter the following policy, replace `bucket_name` with your bucket name:

    ![bucket-policy-editor](images/s3-image-upload/bucket-policy-editor.png)

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::bucket_name/uploads/*"
            }
        ]
    }
    ```

4. Go to IAM console and create a new IAM user. Remember your user credentials(`key`/`access token`)

5. Enter user page, select **Permission** tab, look at **Inline Policies** section, and click **Create User Policy**

    ![iam-user](images/s3-image-upload/iam-user.png)

6. Select **Custom Policy**

    ![custom-policy](images/s3-image-upload/custom-policy.png)

7. Enter the following policy, replace `bucket_name` with your bucket name:

    ![review-policy](images/s3-image-upload/review-policy.png)

    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:*"
                ],
                "Resource": [
                    "arn:aws:s3:::bucket_name/uploads/*"
                ]
            }
        ]
    }
    ```

8. Edit `config.json` and set following keys:

    ```javascript
    {
        "production": {
            ...
            "imageUploadType": "s3",
            "s3": {
                "accessKeyId": "YOUR_S3_ACCESS_KEY_ID",
                "secretAccessKey": "YOUR_S3_ACCESS_KEY",
                "region": "YOUR_S3_REGION" // example: ap-northeast-1
            },
            "s3bucket": "YOUR_S3_BUCKET_NAME"
        }
    }
    ```

9. In additional to edit `config.json` directly, you could also try [environment variable](https://github.com/hackmdio/hackmd#environment-variables-will-overwrite-other-server-configs).

## Related Tools

* [AWS Policy Generator](http://awspolicygen.s3.amazonaws.com/policygen.html)

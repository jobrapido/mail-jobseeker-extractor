CREATE TABLE jobseeker (
	id serial PRIMARY KEY,
	email VARCHAR (355) UNIQUE NOT NULL,
	age smallint  NOT NULL,
	created TIMESTAMP NOT NULL,
	lastvisit TIMESTAMP NOT NULL
);

CREATE TABLE jobseeker_mail_target (
	jobseeker_id INT NOT NULL REFERENCES jobseeker (id) PRIMARY KEY
);
  
CREATE TABLE country_state (
  country VARCHAR (2) PRIMARY KEY,
  lastrun VARCHAR (10) NOT NULL, 
  running BOOLEAN default false
);
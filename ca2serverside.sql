create database CA2_Server_Side;
use CA2_Server_Side;
CREATE TABLE IF NOT EXISTS mysql_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    eircode VARCHAR(10) NOT NULL
);

use ca2_server_side;
select * from mysql_table;
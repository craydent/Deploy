#!/bin/bash

# $1=>project name
# $2=>action
# $3=>full sync path
# $4=>relative node path
# $5=>relative web origin path
# $6=>list of servers

path="/var/craydentdeploy";
archive="$path/backup/$1";
scripts="$path/scripts";
gitpath="$path/git/$1";

#cd $path/git/$1;

# $1=>full archive path
# $2=>full project path
archive_files()
{
    echo "archiving";
    tar -zcvf $1.$(date +%F_%R).tar.gz $2;
}

# $1=>full git path
git_pull()
{
    cd $1;
    echo 'pulling from git';
    git pull -f
}

# $1=>full root path
# $2=>node path
# $3=>full origin path
# $4=>full destination path
www_sync()
{
    cd $1;
    echo 'syncing directories';
    sudo rsync -rtDvO --progress --exclude=".*" --exclude="${2}" ${3} ${4};
}

# $1=>bash node restart script
# $2=>project name
# $3=>list of servers
# $4=>node root folder/server file path
# $4=>do not start
restart_node()
{
    echo 'restart node';
    sudo bash $1 $2 $3 $4 $5;
}

# $1=>full node path
stop_node()
{
    echo 'stop node';
    sudo bash $1 stop;
}

# $1=>full node path
npm_install()
{
    cd $1;
    sudo npm install;
}



case $2 in
start)
    restart_node $scripts/node_script.sh $1 $6 $4;
;;
restart)
    restart_node $scripts/node_script.sh $1 $6 $4;
;;
sync)
    www_sync $gitpath $4 $gitpath/$5 $3;
;;
pull)
    archive_files $archive $gitpath;
    git_pull $gitpath/$1;
;;
build)
    archive_files $archive $gitpath;
    git_pull $gitpath/$1;
    www_sync $gitpath $4 $gitpath/$5 $3;
    npm_install $gitpath/$4;
    restart_node $scripts/node_script.sh $1 $6 $4;
;;
stop)
    restart_node $scripts/node_script.sh $1 $6 $4 "stop";
;;
pullsync)
    archive_files $archive $gitpath;
    git_pull $gitpath/$1;
    www_sync $gitpath $4 $gitpath/$5 $3;
;;
pullrestart)
    git_pull $gitpath/$1;
    npm_install $gitpath/$4;
    restart_node $scripts/node_script.sh $1 $6 $4;
;;
npminstall)
    npm_install $gitpath/$4;
;;
backup)
    archive_files $archive $gitpath;
;;
*)
    echo "Usage {start|stop|restart|sync|pullsync|pullrestart|pull|build|npminstall|backup}"
    exit 1
;;
esac
exit 0;